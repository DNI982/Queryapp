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
  prompt: `You are an expert database administrator.  Your job is to understand the schema of a database and describe it in natural language.

  Here is the schema for a {{{databaseType}}} database:

  {{{databaseSchema}}}

  Describe the schema in natural language, including the tables, columns, and relationships. Focus on the data stored in each table and the primary keys/foreign keys and relationship to other tables. Assume that the user is familiar with general database concepts but not familiar with this particular database. Be concise.
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
