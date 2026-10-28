const postgres = require('postgres');
require('@next/env').loadEnvConfig('.');
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function test() {
  try {
    // 1. Get first user
    const [user] = await sql`select id from auth.users limit 1`;
    if (!user) {
      console.log("No users found");
      return;
    }
    console.log("Found user:", user.id);

    // 2. Try creating workspace directly as db.transaction does
    const wsName = "Test ZitInc " + Math.floor(Math.random() * 1000);
    const slug = wsName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const [ws] = await sql`
      insert into workspaces (name, slug, created_by)
      values (${wsName}, ${slug}, ${user.id})
      returning *;
    `;
    console.log("Created ws:", ws.id, ws.name);

    const [mem] = await sql`
      insert into memberships (workspace_id, user_id, role)
      values (${ws.id}, ${user.id}, 'owner')
      returning *;
    `;
    console.log("Created membership:", mem.id, mem.role);
    console.log("SUCCESS! Workspace creation works perfectly.");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await sql.end();
  }
}

test();
