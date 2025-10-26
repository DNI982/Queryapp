'use client';

import { useState, useMemo } from 'react';
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
} from '@/components/ui/dialog';
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
import { PlusCircle } from 'lucide-react';
import {
  PostgreSqlIcon,
  MongoDbIcon,
  MariaDbIcon,
  OracleIcon,
} from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const iconMap = {
  PostgreSQL: PostgreSqlIcon,
  MongoDB: MongoDbIcon,
  MariaDB: MariaDbIcon,
  Oracle: OracleIcon,
};

type DataSourceType = keyof typeof iconMap;

interface DataSource {
  name: string;
  type: DataSourceType;
  description: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  status: 'Conectado' | 'Desconectado';
}

const initialDataSources: DataSource[] = [
  {
    name: 'PostgreSQL de Producción',
    type: 'PostgreSQL',
    description: 'Base de datos de producción con datos de usuarios y ventas.',
    icon: PostgreSqlIcon,
    status: 'Conectado',
  },
  {
    name: 'MongoDB de Logs',
    type: 'MongoDB',
    description: 'Almacén de documentos para registros y eventos de la aplicación.',
    icon: MongoDbIcon,
    status: 'Conectado',
  },
  {
    name: 'MariaDB Heredada',
    type: 'MariaDB',
    description: 'Base de datos heredada para registros de archivo.',
    icon: MariaDbIcon,
    status: 'Desconectado',
  },
  {
    name: 'Oracle Financiero',
    type: 'Oracle',
    description: 'Almacén de datos financieros para informes.',
    icon: OracleIcon,
    status: 'Conectado',
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

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>(initialDataSources);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      host: '',
      port: undefined,
      username: '',
      password: '',
      database: ''
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, you would test the connection here.
    // We will simulate a successful connection.
    const newDataSource: DataSource = {
      name: values.name,
      type: values.type as DataSourceType,
      description: values.description || 'Sin descripción.',
      icon: iconMap[values.type as DataSourceType],
      status: 'Conectado',
    };
    setDataSources(prev => [...prev, newDataSource]);
    toast({
      title: "Conexión Exitosa",
      description: `La fuente de datos '${values.name}' ha sido añadida.`,
    });
    form.reset();
    setIsDialogOpen(false);
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuentes de Datos</h1>
          <p className="text-muted-foreground">
            Gestione sus conexiones a bases de datos.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Nueva Fuente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Fuente de Datos</DialogTitle>
              <DialogDescription>
                Complete los detalles para conectar una nueva base de datos.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                <DialogFooter className='pt-4'>
                  <Button type="submit">Probar y Guardar Conexión</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dataSources.map((source, index) => (
          <Card key={`${source.name}-${index}`} className="flex flex-col">
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
            <CardFooter>
              <Button variant="outline" className="w-full">
                Gestionar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
