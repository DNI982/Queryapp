'use server';

/**
 * @fileOverview Converts natural language queries into SQL queries.
 *
 * - naturalLanguageToSQL - A function that converts natural language to SQL.
 * - NaturalLanguageToSQLInput - The input type for the naturalLanguageToSQL function.
 * - NaturalLanguageToSQLOutput - The return type for the naturalLanguageToSQL function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageToSQLInputSchema = z.object({
  naturalLanguageQuery: z
    .string()
    .describe('The natural language query to convert to SQL.'),
  databaseSchema: z
    .string()
    .describe(
      'The schema of the database to query, which could be DDL or a description.'
    ),
});
export type NaturalLanguageToSQLInput = z.infer<
  typeof NaturalLanguageToSQLInputSchema
>;

const NaturalLanguageToSQLOutputSchema = z.object({
  sqlQuery: z.string().describe('The SQL query generated from the natural language query.'),
});
export type NaturalLanguageToSQLOutput = z.infer<
  typeof NaturalLanguageToSQLOutputSchema
>;

export async function naturalLanguageToSQL(
  input: NaturalLanguageToSQLInput
): Promise<NaturalLanguageToSQLOutput> {
  return naturalLanguageToSQLFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageToSQLPrompt',
  input: {schema: NaturalLanguageToSQLInputSchema},
  output: {schema: NaturalLanguageToSQLOutputSchema},
  prompt: `You are a SQL expert. Convert the given natural language query into a SQL query that can be executed against the provided database schema.\n\nNatural Language Query: {{{naturalLanguageQuery}}}\n\nDatabase Schema: {{{databaseSchema}}}\n\nSQL Query:`, 
});

const naturalLanguageToSQLFlow = ai.defineFlow(
  {
    name: 'naturalLanguageToSQLFlow',
    inputSchema: NaturalLanguageToSQLInputSchema,
    outputSchema: NaturalLanguageToSQLOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
