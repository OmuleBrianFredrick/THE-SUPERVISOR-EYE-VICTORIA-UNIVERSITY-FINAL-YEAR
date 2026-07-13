import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT email, onboarding_complete, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE email IN (\'christianekarel@gmail.com\', \'simpson.birungi@movitgroup.com\')', (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
