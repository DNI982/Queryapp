'use server';

import { naturalLanguageToSQL } from '@/ai/flows/natural-language-to-sql';

const MOCK_DB_SCHEMA = `
CREATE TABLE customers (
  id INT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100),
  registration_date DATE
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  category VARCHAR(50),
  price DECIMAL(10, 2)
);

CREATE TABLE sales (
  id INT PRIMARY KEY,
  customer_id INT,
  product_id INT,
  sale_date TIMESTAMP,
  quantity INT,
  total_amount DECIMAL(10, 2),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`;

export async function generateSQL(naturalLanguageQuery: string): Promise<{ sqlQuery?: string; error?: string; }> {
  try {
    const result = await naturalLanguageToSQL({
      naturalLanguageQuery,
      databaseSchema: MOCK_DB_SCHEMA,
    });
    return { sqlQuery: result.sqlQuery };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'Failed to generate SQL. Please try again.' };
  }
}
