import sql from 'mssql'
import dotenv from 'dotenv'
dotenv.config()

// SQL Server
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      trustServerCertificate: true, // Allow self-signed certs for dev
    },
  };

  export async function makeConnection(){ 
      try {
          const pool = await sql.connect(dbConfig)
          return pool;
      } catch (error) {
          console.log(error);
      }
  }  
  
  export {sql}