'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, ScanSearch, Trash2 } from 'lucide-react';
import {
  PostgreSqlIcon,
  MongoDbIcon,
  MariaDbIcon,
  OracleIcon,
  MySqlIcon,
} from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { databaseSchemaUnderstanding } from '@/ai/flows/database-schema-understanding';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, onSnapshot, query } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const iconMap = {
  PostgreSQL: PostgreSqlIcon,
  MongoDB: MongoDbIcon,
  MariaDB: MariaDbIcon,
  Oracle: OracleIcon,
  MySQL: MySqlIcon,
};

type DataSourceType = keyof typeof iconMap;

interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  description: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  status: 'Conectado' | 'Desconectado';
  connectionType: 'fields' | 'url';
  host?: string;
  port?: number;
  username?: string;
  database?: string;
  connectionString?: string;
}

const formSchema = z.discriminatedUnion("connectionType", [
  z.object({
    connectionType: z.literal("fields"),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    type: z.enum(['PostgreSQL', 'MongoDB', 'MariaDB', 'Oracle', 'MySQL'], { required_error: 'Debe seleccionar un tipo de base de datos.' }),
    description: z.string().optional(),
    host: z.string().min(1, "El host es obligatorio."),
    port: z.coerce.number().positive("El puerto debe ser un número positivo."),
    username: z.string().min(1, "El usuario es obligatorio."),
    password: z.string(),
    database: z.string().min(1, "El nombre de la base de datos es obligatorio."),
  }),
  z.object({
    connectionType: z.literal("url"),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    type: z.enum(['PostgreSQL', 'MongoDB', 'MariaDB', 'Oracle', 'MySQL'], { required_error: 'Debe seleccionar un tipo de base de datos.' }),
    description: z.string().optional(),
    connectionString: z.string().min(10, "La URL de conexión es obligatoria."),
  }),
]);

const schemaAnalysisSchema = z.object({
    schema: z.string().min(20, 'El esquema debe tener al menos 20 caracteres.'),
});

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAnalyzeDialogOpen, setIsAnalyzeDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const [connectionTab, setConnectionTab] = useState("fields");

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "dataSources"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sources: DataSource[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sources.push({
          id: doc.id,
          ...data,
          icon: iconMap[data.type as DataSourceType] || PostgreSqlIcon,
          status: 'Conectado', // Placeholder status
        } as DataSource);
      });
      setDataSources(sources);
    });
    return () => unsubscribe();
  }, [firestore]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connectionType: "fields",
      name: '',
      description: '',
      host: '',
      username: '',
      password: '',
      database: '',
      port: undefined,
    }
  });
  
  const analysisForm = useForm<z.infer<typeof schemaAnalysisSchema>>({
    resolver: zodResolver(schemaAnalysisSchema),
    defaultValues: {
      schema: '',
    },
  });

  const dbType = form.watch('type');
  const defaultPort = useMemo(() => {
    switch (dbType) {
        case 'PostgreSQL': return 5432;
        case 'MongoDB': return 27017;
        case 'MariaDB': return 3306;
        case 'MySQL': return 3306;
        case 'Oracle': return 1521;
        default: return undefined;
    }
  }, [dbType]);

  useEffect(() => {
    if (selectedDataSource && isManageDialogOpen) {
        setConnectionTab(selectedDataSource.connectionType || 'fields');
        form.reset({
            ...selectedDataSource,
            password: '',
            // @ts-ignore
            port: selectedDataSource.port || undefined,
        })
    } else {
        setConnectionTab('fields');
        form.reset({
            connectionType: "fields",
            name: '',
            type: undefined,
            description: '',
            host: '',
            port: undefined,
            username: '',
            password: '',
            database: ''
        })
    }
}, [selectedDataSource, isManageDialogOpen, form])

  async function onDataSourceSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'La base de datos no está disponible.'});
        return;
    }
    
    try {
        let dataToSave: Omit<DataSource, 'id' | 'icon' | 'status'> = { ...values };

        if (selectedDataSource) { // Editing
          await setDoc(doc(firestore, "dataSources", selectedDataSource.id), dataToSave);
          toast({
            title: "Fuente de Datos Actualizada",
            description: `Se han guardado los cambios en '${values.name}'.`,
          });
          setIsManageDialogOpen(false);
          setSelectedDataSource(null);
        } else { // Adding
          const newId = crypto.randomUUID();
          await setDoc(doc(firestore, "dataSources", newId), dataToSave);
          await setDoc(doc(collection(firestore, `dataSource_queries_${newId}`), '_init'), { initialized: true });

          toast({
            title: "Conexión Exitosa",
            description: `La fuente de datos '${values.name}' ha sido añadida.`,
          });
          setIsAddDialogOpen(false);
        }
        form.reset();
    } catch (error) {
        console.error("Error submitting data source:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la fuente de datos.' })
    }
  }
  
  async function onAnalyzeSchemaSubmit(values: z.infer<typeof schemaAnalysisSchema>) {
      if (!selectedDataSource) return;
      setIsAnalyzing(true);
      setAnalysisResult(null);
      try {
          const result = await databaseSchemaUnderstanding({
              databaseSchema: values.schema,
              databaseType: selectedDataSource.type,
          });
          setAnalysisResult(result.databaseSchemaDescription);
      } catch (error) {
          console.error("Schema analysis failed", error);
          toast({
              variant: 'destructive',
              title: "Error en el Análisis",
              description: "No se pudo analizar el esquema. Por favor, inténtelo de nuevo."
          })
      } finally {
          setIsAnalyzing(false);
      }
  }

  const handleDeleteDataSource = () => {
    if (!selectedDataSource) return;

    setDataSources(dataSources.filter(ds => ds.id !== selectedDataSource.id));
    toast({
        title: 'Fuente de Datos Eliminada',
        description: `'${selectedDataSource.name}' ha sido eliminada.`
    });
    setIsDeleteDialogOpen(false);
    setIsManageDialogOpen(false);
    setSelectedDataSource(null);
  }

  const openDialog = (mode: 'add' | 'manage' | 'analyze', dataSource?: DataSource) => {
    setSelectedDataSource(dataSource || null);
    if (mode === 'add') {
        form.reset();
        setIsAddDialogOpen(true);
    } else if (mode === 'manage') {
        setIsManageDialogOpen(true);
    } else if (mode === 'analyze') {
        analysisForm.reset();
        setAnalysisResult(null);
        setIsAnalyzeDialogOpen(true);
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuentes de Datos</h1>
          <p className="text-muted-foreground">Gestione sus conexiones a bases de datos.</p>
        </div>
        <Button onClick={() => openDialog('add')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Nueva Fuente
        </Button>
      </div>
      
      <Dialog open={isAddDialogOpen || isManageDialogOpen} onOpenChange={selectedDataSource ? setIsManageDialogOpen : setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedDataSource ? 'Gestionar' : 'Añadir Nueva'} Fuente de Datos</DialogTitle>
              <DialogDescription>
                {selectedDataSource ? 'Edite los detalles o elimine la conexión.' : 'Elija un método para conectar una nueva base de datos.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onDataSourceSubmit)} className="space-y-3 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-3 px-1">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de la Conexión</FormLabel>
                            <FormControl>
                            <Input placeholder="p. ej., DB de Producción" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Base de Datos</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                const port = value === 'PostgreSQL' ? 5432 : value === 'MongoDB' ? 27017 : value === 'MariaDB' ? 3306 : value === 'MySQL' ? 3306 : 1521;
                                form.setValue('port', port, { shouldValidate: true });
                            }} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Seleccione un tipo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Object.keys(iconMap).map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                
                <Tabs value={connectionTab} onValueChange={(value) => {
                  setConnectionTab(value);
                  form.setValue('connectionType', value as 'fields' | 'url');
                }} className="w-full pt-2">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fields">Formulario</TabsTrigger>
                    <TabsTrigger value="url">URL de Conexión</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fields" className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Host</FormLabel>
                            <FormControl>
                              <Input placeholder="localhost" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Puerto</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder={defaultPort?.toString() || ""} {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="database"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base de Datos</FormLabel>
                          <FormControl>
                            <Input placeholder="nombre_de_la_db" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usuario</FormLabel>
                              <FormControl>
                                <Input placeholder="admin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contraseña</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-3 pt-2">
                    <FormField
                      control={form.control}
                      name="connectionString"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de Conexión</FormLabel>
                          <FormControl>
                            <Input placeholder="postgresql://user:pass@host:port/db" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className='px-1'>
                      <FormLabel>Descripción <span className="text-muted-foreground">(Opcional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="p. ej. DB para analíticas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className='pt-4 flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2'>
                  {selectedDataSource && (
                    <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </Button>
                  )}
                  <Button type="submit" className={!selectedDataSource ? 'w-full' : ''}>
                    {selectedDataSource ? 'Guardar Cambios' : 'Probar y Guardar Conexión'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dataSources.map((source) => (
          <Card key={source.id} className="flex flex-col">
            <CardHeader className="flex-row items-start gap-4 space-y-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <source.icon className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="line-clamp-1">{source.name}</CardTitle>
                <Badge
                  variant={source.status === 'Conectado' ? 'default' : 'destructive'}
                  className={source.status === 'Conectado' ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400' : 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400'}
                >
                  {source.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">{source.description}</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 items-stretch">
                <Button variant="outline" onClick={() => openDialog('analyze', source)}>
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Analizar Esquema
                </Button>
              <Button variant="secondary" className="w-full" onClick={() => openDialog('manage', source)}>
                Gestionar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
       <Dialog open={isAnalyzeDialogOpen} onOpenChange={setIsAnalyzeDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Analizar Esquema de {selectedDataSource?.name}</DialogTitle>
              <DialogDescription>Pegue aquí el esquema de su base de datos para que la IA lo entienda.</DialogDescription>
            </DialogHeader>
            <Form {...analysisForm}>
              <form onSubmit={analysisForm.handleSubmit(onAnalyzeSchemaSubmit)} className="space-y-4 py-4">
                <FormField
                  control={analysisForm.control}
                  name="schema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Esquema de la Base de Datos ({selectedDataSource?.type})</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={`-- Ejemplo para ${selectedDataSource?.type}\nCREATE TABLE ...`}
                          className="min-h-[200px] resize-y font-code text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isAnalyzing}>
                    {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Analizar con IA
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            {isAnalyzing && (
                 <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analizando esquema...
                </div>
            )}
            {analysisResult && (
                <Alert>
                  <AlertTitle>Análisis de la IA</AlertTitle>
                  <AlertDescription className='whitespace-pre-wrap text-sm max-h-[200px] overflow-y-auto'>
                      {analysisResult}
                  </AlertDescription>
                </Alert>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro que desea eliminar?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción es permanente. Se eliminará la fuente de datos <strong>'{selectedDataSource?.name}'</strong>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDataSource} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
