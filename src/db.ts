import { Pool } from 'pg';

export const pool = new Pool({
  user: 'platform_user',
  host: 'localhost',
  database: 'learning_platform',
  password: 'password',
  port: 5432,
});
