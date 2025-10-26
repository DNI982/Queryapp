'use server';

import { naturalLanguageToSQL } from '@/ai/flows/natural-language-to-sql';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { executeQuery as executeDbQuery } from '@/lib/db-connector';

interface GenerateSQLParams {
    naturalLanguageQuery: string;
    databaseSchema: string;
    databaseType: string;
}

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
    if (!getApps().length) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Failed to initialize Firebase Admin SDK:", e);
            // Propagate a more user-friendly error or handle it as needed
            throw new Error("La configuración del servicio de Firebase es incorrecta o no está disponible.");
        }
    }
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


export async function executeQuery({ query, dataSourceId }: { query: string; dataSourceId: string; }): Promise<{ data?: any[]; error?: string; }> {
    try {
        initializeFirebaseAdmin(); // Ensure Firebase Admin is initialized
        const db = getFirestore();
        const dataSourceRef = db.collection('dataSources').doc(dataSourceId);
        const doc = await dataSourceRef.get();

        if (!doc.exists) {
            return { error: "No se encontró la fuente de datos." };
        }
        
        const dataSource = doc.data();
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
