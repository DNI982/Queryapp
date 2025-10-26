import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import {
  PostgreSqlIcon,
  MongoDbIcon,
  MariaDbIcon,
  OracleIcon,
} from '@/components/icons';
import { Badge } from '@/components/ui/badge';

const dataSources = [
  {
    name: 'PostgreSQL',
    description: 'Base de datos de producción con datos de usuarios y ventas.',
    icon: PostgreSqlIcon,
    status: 'Conectado',
  },
  {
    name: 'MongoDB',
    description: 'Almacén de documentos para registros y eventos de la aplicación.',
    icon: MongoDbIcon,
    status: 'Conectado',
  },
  {
    name: 'MariaDB',
    description: 'Base de datos heredada para registros de archivo.',
    icon: MariaDbIcon,
    status: 'Desconectado',
  },
  {
    name: 'Oracle',
    description: 'Almacén de datos financieros para informes.',
    icon: OracleIcon,
    status: 'Conectado',
  },
];

export default function DataSourcesPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuentes de Datos</h1>
          <p className="text-muted-foreground">
            Gestione sus conexiones a bases de datos.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Nueva Fuente
        </Button>
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
                    <Badge variant={source.status === 'Conectado' ? 'default' : 'destructive'} className={source.status === 'Conectado' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
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
