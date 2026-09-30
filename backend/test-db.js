const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

async function test() {
    await client.connect();

    console.log('--- CONNECTION ---');

    const info = await client.query(`
    SELECT
      current_database(),
      current_user,
      current_schema(),
      inet_server_addr(),
      inet_server_port(),
      to_regclass('auth.users') AS users_table
  `);

    console.log(info.rows);

    console.log('--- SELECT AUTH.USERS ---');

    const users = await client.query(`
    SELECT
      user_id,
      full_name,
      email,
      role
    FROM auth.users
  `);

    console.log(users.rows);

    await client.end();
}

test().catch(console.error);