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
  DialogTrigger,
  DialogClose,
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
} from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { databaseSchemaUnderstanding } from '@/ai/flows/database-schema-understanding';
import { Textarea } from '@/components/ui/textarea';

const iconMap = {
  PostgreSQL: PostgreSqlIcon,
  MongoDB: MongoDbIcon,
  MariaDB: MariaDbIcon,
  Oracle: OracleIcon,
};

type DataSourceType = keyof typeof iconMap;

interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  description: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  status: 'Conectado' | 'Desconectado';
  host?: string;
  port?: number;
  username?: string;
  database?: string;
}

const initialDataSources: DataSource[] = [
  {
    id: '1',
    name: 'PostgreSQL de Producción',
    type: 'PostgreSQL',
    description: 'Base de datos de producción con datos de usuarios y ventas.',
    icon: PostgreSqlIcon,
    status: 'Conectado',
    host: 'prod.db.example.com',
    port: 5432,
    username: 'prod_user',
    database: 'production_db'
  },
  {
    id: '2',
    name: 'MongoDB de Logs',
    type: 'MongoDB',
    description: 'Almacén de documentos para registros y eventos de la aplicación.',
    icon: MongoDbIcon,
    status: 'Conectado',
    host: 'logs.db.example.com',
    port: 27017,
    username: 'log_reader',
    database: 'app_logs'
  },
  {
    id: '3',
    name: 'MariaDB Heredada',
    type: 'MariaDB',
    description: 'Base de datos heredada para registros de archivo.',
    icon: MariaDbIcon,
    status: 'Desconectado',
    host: 'archive.db.example.com',
    port: 3306,
    username: 'archive_user',
    database: 'legacy_archive'
  },
  {
    id: '4',
    name: 'Oracle Financiero',
    type: 'Oracle',
    description: 'Almacén de datos financieros para informes.',
    icon: OracleIcon,
    status: 'Conectado',
    host: 'finance.db.example.com',
    port: 1521,
    username: 'finance_user',
    database: 'finance_data'
  },
];

const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  type: z.enum(['PostgreSQL', 'MongoDB', 'MariaDB', 'Oracle'], { required_error: 'Debe seleccionar un tipo de base de datos.' }),
  description: z.string().optional(),
  host: z.string().min(1, 'El host es obligatorio.'),
  port: z.coerce.number().positive('El puerto debe ser un número positivo.'),
  username: z.string().min(1, 'El usuario es obligatorio.'),
  password: z.string(),
  database: z.string().min(1, 'El nombre de la base de datos es obligatorio.'),
});

const schemaAnalysisSchema = z.object({
    schema: z.string().min(20, 'El esquema debe tener al menos 20 caracteres.'),
});

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>(initialDataSources);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAnalyzeDialogOpen, setIsAnalyzeDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
        case 'Oracle': return 1521;
        default: return undefined;
    }
  }, [dbType]);

  useEffect(() => {
      if (selectedDataSource && isManageDialogOpen) {
          form.reset({
              name: selectedDataSource.name,
              type: selectedDataSource.type,
              description: selectedDataSource.description,
              host: selectedDataSource.host,
              port: selectedDataSource.port,
              username: selectedDataSource.username,
              database: selectedDataSource.database,
              password: '',
          })
      } else {
          form.reset({
              name: '',
              description: '',
              host: '',
              port: undefined,
              username: '',
              password: '',
              database: ''
          })
      }
  }, [selectedDataSource, isManageDialogOpen, form])

  function onDataSourceSubmit(values: z.infer<typeof formSchema>) {
    if (selectedDataSource) { // Editing
      const updatedDataSources = dataSources.map(ds => 
        ds.id === selectedDataSource.id ? {
          ...ds,
          name: values.name,
          type: values.type as DataSourceType,
          description: values.description || 'Sin descripción.',
          icon: iconMap[values.type as DataSourceType],
          host: values.host,
          port: values.port,
          username: values.username,
          database: values.database,
        } : ds
      );
      setDataSources(updatedDataSources);
      toast({
        title: "Fuente de Datos Actualizada",
        description: `Se han guardado los cambios en '${values.name}'.`,
      });
      setIsManageDialogOpen(false);
      setSelectedDataSource(null);
    } else { // Adding
      const newDataSource: DataSource = {
        id: crypto.randomUUID(),
        name: values.name,
        type: values.type as DataSourceType,
        description: values.description || 'Sin descripción.',
        icon: iconMap[values.type as DataSourceType],
        status: 'Conectado', // Assuming connection test is successful
        host: values.host,
        port: values.port,
        username: values.username,
        database: values.database,
      };
      setDataSources(prev => [...prev, newDataSource]);
      toast({
        title: "Conexión Exitosa",
        description: `La fuente de datos '${values.name}' ha sido añadida.`,
      });
      setIsAddDialogOpen(false);
    }
    form.reset();
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

  const sharedFormFields = (
    <>
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
                const port = value === 'PostgreSQL' ? 5432 : value === 'MongoDB' ? 27017 : value === 'MariaDB' ? 3306 : 1521;
                form.setValue('port', port);
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
                <Input type="number" placeholder={defaultPort?.toString() || "5432"} {...field} />
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
        <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción <span className="text-muted-foreground">(Opcional)</span></FormLabel>
            <FormControl>
              <Input placeholder="p. ej. DB para analíticas" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuentes de Datos</h1>
          <p className="text-muted-foreground">
            Gestione sus conexiones a bases de datos.
          </p>
        </div>
        <Button onClick={() => openDialog('add')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Nueva Fuente
        </Button>
      </div>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isManageDialogOpen} onOpenChange={selectedDataSource ? setIsManageDialogOpen : setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedDataSource ? 'Gestionar' : 'Añadir Nueva'} Fuente de Datos</DialogTitle>
              <DialogDescription>
                {selectedDataSource ? 'Edite los detalles de la conexión o elimine la fuente de datos.' : 'Complete los detalles para conectar una nueva base de datos.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onDataSourceSubmit)} className="space-y-3 py-4 max-h-[70vh] overflow-y-auto pr-2">
                {sharedFormFields}
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
                  variant={
                    source.status === 'Conectado' ? 'default' : 'destructive'
                  }
                  className={
                    source.status === 'Conectado'
                      ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400'
                      : 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400'
                  }
                >
                  {source.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {source.description}
              </p>
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
              <DialogDescription>
                Pegue aquí el esquema de su base de datos (por ejemplo, el script DDL) para que la IA pueda entenderlo y describirlo.
              </DialogDescription>
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
                    {isAnalyzing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ScanSearch className="mr-2 h-4 w-4" />
                    )}
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
                    Esta acción es permanente y no se puede deshacer. Se eliminará la fuente de datos <strong>'{selectedDataSource?.name}'</strong>.
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
