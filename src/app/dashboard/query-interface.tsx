'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '@/components/ui/button';
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
} from "@/components/ui/select";
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
import { useQueryHistory } from '@/hooks/use-query-history';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

const formSchema = z.object({
  naturalLanguageQuery: z.string().min(10, {
    message: 'La consulta debe tener al menos 10 caracteres.',
  }),
  dataSource: z.string().min(1, { message: "Debe seleccionar una fuente de datos."})
});

export default function QueryInterface() {
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [isLoadingSql, setIsLoadingSql] = useState(false);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [dataSources, setDataSources] = useState<any>({});
  const { toast } = useToast();
  const { addQueryToHistory } = useQueryHistory();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      naturalLanguageQuery: '',
      dataSource: ''
    },
  });

  useEffect(() => {
    if (firestore) {
      const fetchData = async () => {
        const querySnapshot = await getDocs(collection(firestore, "dataSources"));
        const sources: any = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            sources[doc.id] = {
                name: `${data.name} (${data.type})`,
                type: data.type,
                // Assuming schema is stored elsewhere or not needed for this component's initial display
                schema: `Traer el esquema para ${data.name} (${data.type})` 
            };
        });
        setDataSources(sources);
      };
      fetchData();
    }
  }, [firestore]);

  async function onSqlGenerate(values: z.infer<typeof formSchema>) {
    setIsLoadingSql(true);
    setGeneratedSql(null);
    setQueryResult(null);

    const selectedDataSourceKey = values.dataSource as keyof typeof dataSources;
    const selectedDataSource = dataSources[selectedDataSourceKey];

    const result = await generateSQL({
        naturalLanguageQuery: values.naturalLanguageQuery,
        databaseSchema: selectedDataSource.schema,
        databaseType: selectedDataSource.type,
    });

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error al generar SQL',
        description: result.error,
      });
      addQueryToHistory({
        naturalQuery: values.naturalLanguageQuery,
        sqlQuery: 'Error en la generación de SQL.',
        status: 'Fallido'
      });
    } else {
      setGeneratedSql(result.sqlQuery!);
      toast({
        title: 'SQL Generado',
        description: 'La consulta SQL ha sido generada con éxito.',
      });
    }
    setIsLoadingSql(false);
  }

  function onRunQuery() {
    setIsLoadingResult(true);
    // This is a mock implementation. In a real scenario, you would execute the SQL query.
    setTimeout(() => {
      let resultData = [{"status": "ejecución de consulta simulada", "resultado": "éxito"}];
      setQueryResult(resultData);
      setIsLoadingResult(false);
      toast({
        title: 'Consulta Ejecutada',
        description: `Se han obtenido ${resultData.length} resultados.`,
      });
      addQueryToHistory({
        naturalQuery: form.getValues('naturalLanguageQuery'),
        sqlQuery: generatedSql!,
        status: 'Éxito'
      });
    }, 1500);
  }

  const handleDownloadExcel = () => {
    if (!queryResult) return;
    const worksheet = XLSX.utils.json_to_sheet(queryResult);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');
    XLSX.writeFile(workbook, 'resultados_consulta.xlsx');
    toast({ title: 'Descarga Iniciada', description: 'El archivo Excel se está descargando.'});
  };

  const handleDownloadPdf = () => {
    if (!queryResult) return;
    const doc = new jsPDF();
    const tableHead = [Object.keys(queryResult[0])];
    const tableBody = queryResult.map(row => Object.values(row).map(String));
    
    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        didDrawPage: (data) => {
            doc.text('Resultados de la Consulta', data.settings.margin.left, 15);
        }
    });

    doc.save('resultados_consulta.pdf');
    toast({ title: 'Descarga Iniciada', description: 'El archivo PDF se está descargando.'});
  };

  const tableHeaders = queryResult ? Object.keys(queryResult[0] || {}) : [];

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSqlGenerate)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                 <FormField
                    control={form.control}
                    name="dataSource"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fuente de Datos</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una fuente..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(dataSources).map(([key, source]) => (
                                        <SelectItem key={key} value={key}>{(source as any).name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="naturalLanguageQuery"
                  render={({ field }) => (
                    <FormItem className='md:col-span-2'>
                        <FormLabel>Consulta en Lenguaje Natural</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="p. ej., 'muéstrame todos los clientes de Nueva York'"
                            className="min-h-[100px] resize-none text-base"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isLoadingSql || !form.formState.isValid}>
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
                Ejecutando consulta y obteniendo resultados...
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
                    <Button variant="outline" size="sm" onClick={handleDownloadExcel}><Download className="mr-2 h-4 w-4"/> Excel</Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4"/> PDF</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableHeaders.map(header => (
                        <TableHead key={header} className="capitalize">{header.replace(/_/g, ' ')}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResult.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {tableHeaders.map(header => (
                          <TableCell key={`${rowIndex}-${header}`}>{row[header]}</TableCell>
                        ))}
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
