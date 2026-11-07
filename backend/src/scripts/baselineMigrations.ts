import "reflect-metadata";
import dotenv from "dotenv";
import { Table } from "typeorm";
import { AppDataSource, describeDatabase } from "../config/database";

dotenv.config();

/**
 * Adopt an existing database that was created with `synchronize: true`.
 *
 * Such a database already has every table but no `migrations` table, so running
 * the initial migration would fail with "table already exists". This records the
 * migrations as already executed, without touching any data.
 *
 *   npm run db:baseline
 *
 * It refuses to run against an empty database: use `npm run migration:run` there.
 */
async function main() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const hasUsersTable = await queryRunner.hasTable("users");
    if (!hasUsersTable) {
      console.error(
        `❌ ${describeDatabase()} has no application tables yet.\n` +
          "   Run `npm run migration:run` to create the schema instead of baselining."
      );
      process.exitCode = 1;
      return;
    }

    const migrations = AppDataSource.migrations ?? [];
    if (migrations.length === 0) {
      console.error("❌ No migrations found for this driver — nothing to baseline.");
      process.exitCode = 1;
      return;
    }

    if (!(await queryRunner.hasTable("migrations"))) {
      await queryRunner.createTable(
        new Table({
          name: "migrations",
          columns: [
            { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
            { name: "timestamp", type: "bigint" },
            { name: "name", type: "varchar" },
          ],
        })
      );
      console.log("✅ Created the migrations bookkeeping table.");
    }

    const executed: Array<{ name: string }> = await queryRunner.query(
      "SELECT name FROM migrations"
    );
    const executedNames = new Set(executed.map((row) => row.name));

    // Only the oldest migration describes the schema a synchronized database
    // already has. Everything after it is a real change that must still run.
    const ordered = [...migrations].sort((a, b) => Number(timestampOf(a)) - Number(timestampOf(b)));
    const initial = ordered[0];
    const initialName = initial.name || initial.constructor.name;

    if (executedNames.has(initialName)) {
      console.log(`🎉 Baseline already up to date on ${describeDatabase()}.`);
    } else {
      await queryRunner.query(
        "INSERT INTO migrations (timestamp, name) VALUES (?, ?)",
        [Number(timestampOf(initial)), initialName]
      );
      console.log(`✅ Marked ${initialName} as already applied.`);
      console.log(
        `▶️  Run \`npm run migration:run\` to apply the remaining ${ordered.length - 1} migration(s).`
      );
    }
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

/** Read the migration timestamp from its class name (`Name1793622905607`). */
function timestampOf(migration: { name?: string; constructor: { name: string } }): string {
  const match = migration.constructor.name.match(/(\d+)$/);
  if (!match) throw new Error(`Cannot read a timestamp from migration ${migration.constructor.name}`);
  return match[1];
}

main().catch((error) => {
  console.error("❌ Baseline failed:", error);
  process.exit(1);
});
