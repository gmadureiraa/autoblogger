import postgres from "postgres";

const schema = process.env.DATABASE_SCHEMA;
if (!schema) throw new Error("DATABASE_SCHEMA env var required");

export const sql = postgres(process.env.DATABASE_URL!, {
  // search_path garante que queries sem schema caem no schema do projeto (autoblogger)
  connection: { search_path: `${schema},public` },
  // Neon hiberna — idle_timeout evita conexões abertas matando o pool
  idle_timeout: 20,
  max: 10,
});

// Exemplo de uso em Route Handler / Server Component:
// import { sql } from "@/lib/neon";
// const rows = await sql`SELECT * FROM posts WHERE user_id = ${userId}`;
