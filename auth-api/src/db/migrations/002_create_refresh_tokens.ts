import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("refresh_tokens", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("token").notNullable().unique();
    table.timestamp("expires_at").notNullable();
    table.timestamps(true, true);
    // Индекс для автоматического удаления истёкших токенов не встроен в PG,
    // можно добавить задачу очистки, либо просто проверять дату при запросе.
    // Для простоты оставим ручное удаление при refresh/логауте.
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("refresh_tokens");
}
