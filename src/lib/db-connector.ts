'use server';

import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient, Db } from 'mongodb';

// Helper function to convert BigInt to string for JSON serialization
const jsonReplacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

async function getMongoDb(dataSource: any): Promise<Db> {
    let connectionString = dataSource.connectionString;
    if (!connectionString) {
        const user = dataSource.username ? `${encodeURIComponent(dataSource.username)}:${encodeURIComponent(dataSource.password || '')}@` : '';
        connectionString = `mongodb://${user}${dataSource.host}:${dataSource.port}/`;
    }
    const client = new MongoClient(connectionString);
    await client.connect();
    return client.db(dataSource.database);
}

export async function testConnection(dataSource: any) {
    let connection: any;
    try {
        switch (dataSource.type) {
            case 'PostgreSQL':
                const pool = new Pool({
                    connectionString: dataSource.connectionString,
                    host: dataSource.host,
                    port: dataSource.port,
                    user: dataSource.username,
                    password: dataSource.password,
                    database: dataSource.database,
                    connectionTimeoutMillis: 5000,
                });
                connection = await pool.connect();
                await connection.query('SELECT 1');
                connection.release();
                await pool.end();
                break;
            case 'MySQL':
            case 'MariaDB':
                connection = await mysql.createConnection(dataSource.connectionString || {
                    host: dataSource.host,
                    port: dataSource.port,
                    user: dataSource.username,
                    password: dataSource.password,
                    database: dataSource.database,
                    connectTimeout: 5000,
                });
                await connection.query('SELECT 1');
                break;
            case 'MongoDB':
                const db = await getMongoDb(dataSource);
                await db.command({ ping: 1 });
                // We need to close the underlying client connection
                await db.client.close();
                break;
            case 'Oracle':
                throw new Error('La conexión a Oracle no está implementada en este momento.');
            default:
                throw new Error(`Tipo de base de datos no soportado: ${dataSource.type}`);
        }
    } catch (error: any) {
        // Re-throw a more user-friendly error
        throw new Error(error.message || 'Error de conexión desconocido.');
    } finally {
        if (connection && connection.end) {
            await connection.end();
        }
    }
}


export async function executeQuery(dataSource: any, sqlQuery: string) {
    let results: any;
    let connection: any;

    try {
        switch (dataSource.type) {
            case 'PostgreSQL':
                const pool = new Pool({
                    connectionString: dataSource.connectionString,
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
                 connection = await mysql.createConnection(dataSource.connectionString || {
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
                    const db = await getMongoDb(dataSource);
                    try {
                        // This is a very simplified and UNSAFE way to execute mongo queries.
                        // In a real app, you MUST sanitize and validate the query string.
                        // Using eval is dangerous. This is for demonstration purposes.
                        const mongoFunction = new Function('db', `return (async () => { ${sqlQuery} })()`);
                        const mongoResult = await mongoFunction(db);
                        results = Array.isArray(mongoResult) ? mongoResult : [mongoResult];

                    } finally {
                        await db.client.close();
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