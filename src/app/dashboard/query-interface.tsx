'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CodeBlock } from '@/components/code-block';
import { Download, Loader2, Sparkles, Table as TableIcon } from 'lucide-react';
import { generateSQL } from './actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  naturalLanguageQuery: z.string().min(10, {
    message: 'La consulta debe tener al menos 10 caracteres.',
  }),
});

const mockData = [
    { id: 1, product: 'Laptop Pro', sales: 150, month: 'Enero' },
    { id: 2, product: 'Ratón Inalámbrico', sales: 450, month: 'Enero' },
    { id: 3, product: 'Laptop Pro', sales: 200, month: 'Febrero' },
    { id: 4, product: 'Webcam HD', sales: 300, month: 'Febrero' },
    { id: 5, product: 'Laptop Pro', sales: 180, month: 'Marzo' },
    { id: 6, product: 'Ratón Inalámbrico', sales: 500, month: 'Marzo' },
];

export default function QueryInterface() {
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [isLoadingSql, setIsLoadingSql] = useState(false);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      naturalLanguageQuery: '',
    },
  });

  async function onSqlGenerate(values: z.infer<typeof formSchema>) {
    setIsLoadingSql(true);
    setGeneratedSql(null);
    setQueryResult(null);
    const result = await generateSQL(values.naturalLanguageQuery);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error al generar SQL',
        description: result.error,
      });
    } else {
      setGeneratedSql(result.sqlQuery!);
    }
    setIsLoadingSql(false);
  }

  function onRunQuery() {
    setIsLoadingResult(true);
    setTimeout(() => {
      setQueryResult(mockData);
      setIsLoadingResult(false);
    }, 1500);
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSqlGenerate)} className="space-y-4">
              <FormField
                control={form.control}
                name="naturalLanguageQuery"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="p. ej., 'muéstrame las ventas de los últimos tres meses, ordenadas por precio de mayor a menor'"
                        className="min-h-[100px] resize-none text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingSql}>
                {isLoadingSql ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generar SQL
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isLoadingSql && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center p-8 text-muted-foreground"
            >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generando SQL con IA...
            </motion.div>
        )}
        {generatedSql && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>SQL Generado</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock code={generatedSql} />
                <Button onClick={onRunQuery} disabled={isLoadingResult} className="mt-4">
                  {isLoadingResult ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TableIcon className="mr-2 h-4 w-4" />
                  )}
                  Ejecutar Consulta
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

       <AnimatePresence>
        {isLoadingResult && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center p-8 text-muted-foreground"
            >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Ejecutando consulta...
            </motion.div>
        )}
        {queryResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Resultados de la Consulta</CardTitle>
                <div className="space-x-2">
                    <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/> Excel</Button>
                    <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/> PDF</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Ventas</TableHead>
                      <TableHead>Mes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResult.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell>{row.sales}</TableCell>
                        <TableCell>{row.month}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
       </AnimatePresence>
    </div>
  );
}
