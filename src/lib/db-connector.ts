'use server';

import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

// Helper function to convert BigInt to string for JSON serialization
const jsonReplacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

export async function executeQuery(dataSource: any, sqlQuery: string) {
    let results: any;
    let connection: any;

    try {
        switch (dataSource.type) {
            case 'PostgreSQL':
                const pool = new Pool({
                    host: dataSource.host,
                    port: dataSource.port,
                    user: dataSource.username,
                    password: dataSource.password,
                    database: dataSource.database,
                });
                const client = await pool.connect();
                try {
                    const res = await client.query(sqlQuery);
                    results = res.rows;
                } finally {
                    client.release();
                    await pool.end();
                }
                break;

            case 'MySQL':
            case 'MariaDB':
                 connection = await mysql.createConnection({
                    host: dataSource.host,
                    port: dataSource.port,
                    user: dataSource.username,
                    password: dataSource.password,
                    database: dataSource.database,
                });
                const [rows] = await connection.execute(sqlQuery);
                results = rows;
                break;

            case 'MongoDB':
                if (sqlQuery.trim().toLowerCase().startsWith('db.')) {
                    let connectionString = dataSource.connectionString;
                    
                    if (!connectionString) {
                        const user = dataSource.username ? `${encodeURIComponent(dataSource.username)}:${encodeURIComponent(dataSource.password || '')}@` : '';
                        connectionString = `mongodb://${user}${dataSource.host}:${dataSource.port}/${dataSource.database}`;
                    }

                    const mongoClient = new MongoClient(connectionString);
                    await mongoClient.connect();
                    try {
                        const db = mongoClient.db();
                        // This is a very simplified and UNSAFE way to execute mongo queries.
                        // In a real app, you MUST sanitize and validate the query string.
                        // Using eval is dangerous. This is for demonstration purposes.
                        const mongoResult = await eval(`(async () => { return ${sqlQuery} })()`);
                        results = Array.isArray(mongoResult) ? mongoResult : [mongoResult];
                    } finally {
                        await mongoClient.close();
                    }
                } else {
                     throw new Error('Solo se admiten consultas de MongoDB que comiencen con "db.".');
                }
                break;
            
            case 'Oracle':
                throw new Error('La conexión a Oracle no está implementada en este momento.');

            default:
                throw new Error(`Tipo de base de datos no soportado: ${dataSource.type}`);
        }
        
        // Return a JSON-serializable result
        return JSON.parse(JSON.stringify(results, jsonReplacer));

    } catch (error: any) {
        console.error(`Error al ejecutar la consulta en ${dataSource.type}:`, error);
        throw new Error(error.message || 'Ocurrió un error al ejecutar la consulta en la base de datos.');
    } finally {
        if (connection && connection.end) {
            await connection.end();
        }
    }
}
