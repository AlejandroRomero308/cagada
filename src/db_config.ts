// src/db_config.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost', // Dirección del servidor MySQL (normalmente localhost con XAMPP)
  user: 'root',      // Usuario de MySQL (por defecto 'root' en XAMPP sin contraseña)
  password: '',      // Contraseña de MySQL (vacía por defecto en XAMPP)
  database: 'retro_fc_db', // El nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;