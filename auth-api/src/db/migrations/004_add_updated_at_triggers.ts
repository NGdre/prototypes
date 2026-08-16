import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Apply the trigger to every table that has an updated_at column,
  // so new tables with timestamps get it automatically.
  await knex.raw(`
    DO $$
    DECLARE
      t TEXT;
    BEGIN
      FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
      LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
        EXECUTE format(
          'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
          t
        );
      END LOOP;
    END;
    $$;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$
    DECLARE
      t TEXT;
    BEGIN
      FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
      END LOOP;
    END;
    $$;
  `);

  await knex.raw("DROP FUNCTION IF EXISTS set_updated_at()");
}