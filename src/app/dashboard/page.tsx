import QueryInterface from './query-interface';

export default function QueriesPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Consultas</h1>
        <p className="text-muted-foreground">
          Seleccione una fuente de datos y convierta sus preguntas en lenguaje natural a consultas SQL con IA.
        </p>
      </div>
      <QueryInterface />
    </div>
  );
}
