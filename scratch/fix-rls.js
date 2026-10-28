const postgres = require('postgres');
require('@next/env').loadEnvConfig('.');
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function run() {
  try {
    await sql.unsafe(`
      DROP POLICY IF EXISTS ws_insert ON workspaces;
      CREATE POLICY ws_insert ON workspaces FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

      DROP POLICY IF EXISTS mem_insert_owner ON memberships;
      CREATE POLICY mem_insert_owner ON memberships FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role = 'owner');
    `);
    console.log("Successfully created ws_insert and mem_insert_owner policies!");
  } catch (err) {
    console.error("Error creating policies:", err);
  } finally {
    await sql.end();
  }
}

run();
