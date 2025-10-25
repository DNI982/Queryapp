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

const queryHistory = [
  {
    id: 'q1',
    naturalQuery: 'Show me all customers from New York.',
    sqlQuery: "SELECT * FROM customers WHERE city = 'New York';",
    timestamp: new Date('2023-10-26T10:00:00Z'),
    status: 'Success',
  },
  {
    id: 'q2',
    naturalQuery: 'What are the total sales for each product category?',
    sqlQuery:
      'SELECT category, SUM(total_amount) as total_sales FROM sales s JOIN products p ON s.product_id = p.id GROUP BY p.category;',
    timestamp: new Date('2023-10-26T10:05:00Z'),
    status: 'Success',
  },
  {
    id: 'q3',
    naturalQuery: 'Find top 5 most recent sales.',
    sqlQuery: 'SELECT * FROM sales ORDER BY sale_date DESC LIMIT 5;',
    timestamp: new Date('2023-10-26T10:10:00Z'),
    status: 'Success',
  },
  {
    id: 'q4',
    naturalQuery: 'List users who registered in the last 30 days.',
    sqlQuery:
      "SELECT * FROM customers WHERE registration_date >= DATE('now', '-30 days');",
    timestamp: new Date('2023-10-26T10:15:00Z'),
    status: 'Failed',
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
                    {format(item.timestamp, 'MMM d, yyyy, h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'Success' ? 'default' : 'destructive'
                      }
                      className={item.status === 'Success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
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
