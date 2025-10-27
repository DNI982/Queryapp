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
  databaseType: z.string().describe('The type of the database (e.g., PostgreSQL, MongoDB Shell Command, MariaDB, Oracle).'),
});
export type NaturalLanguageToSQLInput = z.infer<
  typeof NaturalLanguageToSQLInputSchema
>;

const NaturalLanguageToSQLOutputSchema = z.object({
  sqlQuery: z.string().describe('The database query generated from the natural language query. This should be a single, executable query string. For MongoDB, this should be a valid MongoDB Shell Command.'),
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
  prompt: `You are a database query expert. Convert the given natural language query into a single, executable query that can be executed against the provided database schema for a {{{databaseType}}} database.

  IMPORTANT:
  - Your output must be ONLY the raw query string. Do not wrap it in markdown, comments, or any other formatting.
  - If the database type is 'MongoDB Shell Command', you must generate a command like 'db.collection.find(...).toArray()'. The command must be a single line of code.

  Natural Language Query: {{{naturalLanguageQuery}}}
  
  Database Schema: 
  \`\`\`
  {{{databaseSchema}}}
  \`\`\`
  
  Query:`, 
});

const naturalLanguageToSQLFlow = ai.defineFlow(
  {
    name: 'naturalLanguageToSQLFlow',
    inputSchema: NaturalLanguageToSQLInputSchema,
    outputSchema: NaturalLanguageToSQLOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Clean up the output to ensure it's just the raw query
    let query = output!.sqlQuery.trim();
    if (query.startsWith('```') && query.endsWith('```')) {
      query = query.substring(3, query.length - 3).trim();
      const firstLineBreak = query.indexOf('\n');
      if (firstLineBreak !== -1) {
        // This handles cases where the AI might still add a language identifier like 'sql'
        const potentialLang = query.substring(0, firstLineBreak).trim();
        if (potentialLang === 'sql' || potentialLang === 'javascript' || potentialLang === 'js') {
            query = query.substring(firstLineBreak + 1).trim();
        }
      }
    }
    return { sqlQuery: query };
  }
);
