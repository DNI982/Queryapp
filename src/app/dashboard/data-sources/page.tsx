
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import {
  PostgreSqlIcon,
  MongoDbIcon,
  MariaDbIcon,
  OracleIcon,
} from '@/components/icons';
import { Badge } from '@/components/ui/badge';

const iconMap = {
  PostgreSQL: PostgreSqlIcon,
  MongoDB: MongoDbIcon,
  MariaDB: MariaDbIcon,
  Oracle: OracleIcon,
};

const initialDataSources = [
  {
    name: 'PostgreSQL',
    type: 'PostgreSQL' as keyof typeof iconMap,
    description: 'Base de datos de producción con datos de usuarios y ventas.',
    icon: PostgreSqlIcon,
    status: 'Conectado',
  },
  {
    name: 'MongoDB',
    type: 'MongoDB' as keyof typeof iconMap,
    description: 'Almacén de documentos para registros y eventos de la aplicación.',
    icon: MongoDbIcon,
    status: 'Conectado',
  },
  {
    name: 'MariaDB',
    type: 'MariaDB' as keyof typeof iconMap,
    description: 'Base de datos heredada para registros de archivo.',
    icon: MariaDbIcon,
    status: 'Desconectado',
  },
  {
    name: 'Oracle',
    type: 'Oracle' as keyof typeof iconMap,
    description: 'Almacén de datos financieros para informes.',
    icon: OracleIcon,
    status: 'Conectado',
  },
];

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  type: z.enum(['PostgreSQL', 'MongoDB', 'MariaDB', 'Oracle']),
  description: z.string().min(1, 'La descripción es obligatoria.'),
});

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState(initialDataSources);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'PostgreSQL',
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newDataSource = {
      ...values,
      icon: iconMap[values.type as keyof typeof iconMap],
      status: 'Conectado',
    };
    setDataSources([...dataSources, newDataSource]);
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Fuente de Datos</DialogTitle>
              <DialogDescription>
                Complete los detalles para conectar una nueva base de datos.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="p. ej., Base de datos de Staging" {...field} />
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
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo de base de datos" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                          <SelectItem value="MongoDB">MongoDB</SelectItem>
                          <SelectItem value="MariaDB">MariaDB</SelectItem>
                          <SelectItem value="Oracle">Oracle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Breve descripción de la fuente de datos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Guardar Conexión</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dataSources.map((source) => (
          <Card key={source.name}>
            <CardHeader className="flex-row items-start gap-4 space-y-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <source.icon className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle>{source.name}</CardTitle>
                <Badge
                  variant={
                    source.status === 'Conectado' ? 'default' : 'destructive'
                  }
                  className={
                    source.status === 'Conectado'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }
                >
                  {source.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
