/**
 * Script pra rodar uma migration SQL contra o Neon.
 * Uso: bun scripts/run-migration.ts <caminho-arquivo>
 */
import { readFile } from "node:fs/promises"
import path from "node:path"
import postgres from "postgres"

const fileArg = process.argv[2]
if (!fileArg) {
  console.error("uso: bun scripts/run-migration.ts <arquivo.sql>")
  process.exit(1)
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error("DATABASE_URL nao definida")
  process.exit(1)
}

const abs = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg)
const sqlText = await readFile(abs, "utf8")

const sql = postgres(dbUrl, { max: 1, idle_timeout: 5 })

try {
  console.log(`[migration] running ${abs}`)
  await sql.unsafe(sqlText)
  console.log("[migration] ok")
} catch (err) {
  console.error("[migration] falhou:", err)
  process.exit(1)
} finally {
  await sql.end()
}
