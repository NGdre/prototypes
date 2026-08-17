import knex from "knex";
import { knexConfig } from "./knex-config.js";

const db = knex(knexConfig);

export default db;