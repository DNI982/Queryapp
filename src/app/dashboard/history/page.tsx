import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const queryHistory = [
  {
    id: 'q1',
    naturalQuery: 'Muéstrame todos los clientes de Nueva York.',
    sqlQuery: "SELECT * FROM customers WHERE city = 'New York';",
    timestamp: new Date('2023-10-26T10:00:00Z'),
    status: 'Éxito',
  },
  {
    id: 'q2',
    naturalQuery: '¿Cuáles son las ventas totales por categoría de producto?',
    sqlQuery:
      'SELECT category, SUM(total_amount) as total_sales FROM sales s JOIN products p ON s.product_id = p.id GROUP BY p.category;',
    timestamp: new Date('2023-10-26T10:05:00Z'),
    status: 'Éxito',
  },
  {
    id: 'q3',
    naturalQuery: 'Encuentra las 5 ventas más recientes.',
    sqlQuery: 'SELECT * FROM sales ORDER BY sale_date DESC LIMIT 5;',
    timestamp: new Date('2023-10-26T10:10:00Z'),
    status: 'Éxito',
  },
  {
    id: 'q4',
    naturalQuery: 'Lista los usuarios que se registraron en los últimos 30 días.',
    sqlQuery:
      "SELECT * FROM customers WHERE registration_date >= DATE('now', '-30 days');",
    timestamp: new Date('2023-10-26T10:15:00Z'),
    status: 'Fallido',
  },
];

export default function HistoryPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Historial de Consultas</h1>
        <p className="text-muted-foreground">
          Revise sus consultas ejecutadas anteriormente.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consulta</TableHead>
                <TableHead>SQL Generado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queryHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-xs truncate font-medium">
                    {item.naturalQuery}
                  </TableCell>
                  <TableCell className="font-code text-xs max-w-xs truncate text-muted-foreground">
                    {item.sqlQuery}
                  </TableCell>
                  <TableCell>
                    {format(item.timestamp, 'd MMM, yyyy, h:mm a', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'Éxito' ? 'default' : 'destructive'
                      }
                      className={item.status === 'Éxito' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
