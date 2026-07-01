/**
 * Busca a anon key do projeto no Supabase (requer login prévio).
 *
 * Uso:
 *   npx supabase login
 *   node scripts/fetch-supabase-anon-key.mjs
 */

import { execSync } from "child_process";

const projectRef = "lmsaeqmxfqqaabwadqkv";

try {
  const output = execSync(
    `npx supabase projects api-keys --project-ref ${projectRef} -o json`,
    { encoding: "utf8" },
  );
  const keys = JSON.parse(output);
  const anon = keys.find((k) => k.name === "anon" || k.type === "anon");

  if (!anon?.api_key) {
    console.error("Não foi possível encontrar a anon key. Saída:", output);
    process.exit(1);
  }

  console.log("\nCole no .env:\n");
  console.log(`VITE_SUPABASE_ANON_KEY="${anon.api_key}"`);
  console.log(`VITE_SUPABASE_USE_PROXY="false"\n`);
} catch (error) {
  console.error("Erro. Execute antes: npx supabase login");
  console.error(error.message);
  process.exit(1);
}
