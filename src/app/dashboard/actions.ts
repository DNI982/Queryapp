'use server';

import { naturalLanguageToSQL } from '@/ai/flows/natural-language-to-sql';

interface GenerateSQLParams {
    naturalLanguageQuery: string;
    databaseSchema: string;
    databaseType: string;
}

export async function generateSQL({ naturalLanguageQuery, databaseSchema, databaseType }: GenerateSQLParams): Promise<{ sqlQuery?: string; error?: string; }> {
  try {
    const result = await naturalLanguageToSQL({
      naturalLanguageQuery,
      databaseSchema,
      databaseType,
    });
    return { sqlQuery: result.sqlQuery };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'Failed to generate SQL. Please try again.' };
  }
}
