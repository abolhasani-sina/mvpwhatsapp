/**
 * Migration: 004_add_template_applied_at
 * Phase 2 fix — Adds template_applied_at column to businesses
 * for reliable one-time template application guard.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('businesses', (table) => {
    table.timestamp('template_applied_at').defaultTo(null);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('businesses', (table) => {
    table.dropColumn('template_applied_at');
  });
};
