'use client';

import { useQueryHistory } from '@/hooks/use-query-history';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const { queryHistory, clearHistory } = useQueryHistory();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Historial de Consultas</h1>
        <p className="text-muted-foreground">
          Revise las consultas que ha generado y ejecutado.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historial Reciente</CardTitle>
            <CardDescription>
              Aquí se muestran sus últimas 10 consultas. El historial se borra al cerrar la pestaña.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={clearHistory} disabled={queryHistory.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Historial
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Consulta</TableHead>
                <TableHead className="w-[40%]">SQL Generado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queryHistory.length > 0 ? (
                queryHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-xs truncate font-medium">
                      {item.naturalQuery}
                    </TableCell>
                    <TableCell className="font-code text-xs max-w-sm truncate text-muted-foreground">
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
                        className={item.status === 'Éxito' ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400' : ''}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No hay consultas en el historial.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
