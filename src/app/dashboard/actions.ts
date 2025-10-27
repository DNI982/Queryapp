'use server';

import { naturalLanguageToSQL } from '@/ai/flows/natural-language-to-sql';
import { executeQuery as executeDbQuery, testConnection as testDbConnection } from '@/lib/db-connector';

interface GenerateSQLParams {
    naturalLanguageQuery: string;
    databaseSchema: string;
    databaseType: string;
}

export async function generateSQL({ naturalLanguageQuery, databaseSchema, databaseType }: GenerateSQLParams): Promise<{ sqlQuery?: string; error?: string; }> {
  try {
    // For MongoDB, we instruct the AI to generate shell commands instead of SQL
    const finalDbType = databaseType === 'MongoDB' ? 'MongoDB Shell Command' : databaseType;
    const result = await naturalLanguageToSQL({
      naturalLanguageQuery,
      databaseSchema,
      databaseType: finalDbType,
    });
    return { sqlQuery: result.sqlQuery };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'Failed to generate SQL. Please try again.' };
  }
}

export async function executeQuery({ query, dataSource }: { query: string; dataSource: any; }): Promise<{ data?: any[]; error?: string; }> {
    try {
        if (!dataSource) {
             return { error: "Los datos de la fuente de datos son inválidos." };
        }

        const data = await executeDbQuery(dataSource, query);

        if (!data || data.length === 0) {
            return { data: [{ "status": "Éxito, pero la consulta no devolvió resultados." }]};
        }

        return { data };

    } catch (e: any) {
        console.error(e);
        return { error: e.message || 'Ocurrió un error inesperado al ejecutar la consulta.' };
    }
}

export async function testConnection(dataSource: any): Promise<{ success: boolean; error?: string; }> {
    try {
        await testDbConnection(dataSource);
        return { success: true };
    } catch (error: any) {
        console.error('Error en la prueba de conexión:', error);
        return { success: false, error: error.message || 'Error de conexión desconocido.' };
    }
}