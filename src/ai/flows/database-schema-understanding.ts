'use server';

/**
 * @fileOverview A database schema understanding AI agent.
 *
 * - databaseSchemaUnderstanding - A function that handles the database schema understanding process.
 * - DatabaseSchemaUnderstandingInput - The input type for the databaseSchemaUnderstanding function.
 * - DatabaseSchemaUnderstandingOutput - The return type for the databaseSchemaUnderstanding function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DatabaseSchemaUnderstandingInputSchema = z.object({
  databaseSchema: z
    .string()
    .describe(
      'The schema of the database, as a string.  This could be a DDL script or other schema description.'
    ),
  databaseType: z.string().describe('The type of the database (e.g., PostgreSQL, MongoDB, MariaDB, Oracle).'),
});
export type DatabaseSchemaUnderstandingInput = z.infer<
  typeof DatabaseSchemaUnderstandingInputSchema
>;

const DatabaseSchemaUnderstandingOutputSchema = z.object({
  databaseSchemaDescription: z
    .string()
    .describe('A natural language description of the database schema.'),
});
export type DatabaseSchemaUnderstandingOutput = z.infer<
  typeof DatabaseSchemaUnderstandingOutputSchema
>;

export async function databaseSchemaUnderstanding(
  input: DatabaseSchemaUnderstandingInput
): Promise<DatabaseSchemaUnderstandingOutput> {
  return databaseSchemaUnderstandingFlow(input);
}

const databaseSchemaUnderstandingPrompt = ai.definePrompt({
  name: 'databaseSchemaUnderstandingPrompt',
  input: {schema: DatabaseSchemaUnderstandingInputSchema},
  output: {schema: DatabaseSchemaUnderstandingOutputSchema},
  prompt: `Eres un administrador de bases de datos experto. Tu trabajo es entender el esquema de una base de datos y describirlo en lenguaje natural.

  IMPORTANTE: Tu respuesta DEBE ser en español.

  Aquí está el esquema para una base de datos {{{databaseType}}}:

  {{{databaseSchema}}}

  Describe el esquema en español, incluyendo las tablas, columnas y relaciones. Enfócate en los datos almacenados en cada tabla y las claves primarias/foráneas y su relación con otras tablas. Asume que el usuario está familiarizado con conceptos generales de bases de datos pero no con esta base de datos en particular. Sé conciso.
  `,
});

const databaseSchemaUnderstandingFlow = ai.defineFlow(
  {
    name: 'databaseSchemaUnderstandingFlow',
    inputSchema: DatabaseSchemaUnderstandingInputSchema,
    outputSchema: DatabaseSchemaUnderstandingOutputSchema,
  },
  async input => {
    const {output} = await databaseSchemaUnderstandingPrompt(input);
    return output!;
  }
);
