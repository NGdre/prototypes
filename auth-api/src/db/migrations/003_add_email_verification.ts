import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.timestamp("email_verified_at").nullable();
  });

  await knex.schema.createTable("verification_tokens", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .enum("type", ["password_reset", "email_verify", "email_change"])
      .notNullable();
    table.string("token_hash", 255).notNullable();
    table.jsonb("metadata").nullable();
    table.timestamp("expires_at").notNullable();
    table.timestamp("used_at").nullable();
    table.timestamps(true, true);

    table.index(["user_id", "type"]);
    table.index("expires_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("verification_tokens");

  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("email_verified");
    table.dropColumn("email_verified_at");
  });
}
