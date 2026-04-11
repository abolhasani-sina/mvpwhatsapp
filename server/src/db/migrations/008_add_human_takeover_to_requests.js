/**
 * Migration: 008_add_human_takeover_to_requests
 * Phase 5b — Human Takeover capability
 *
 * Adds is_human_taken_over flag and taken_over_at timestamp to requests.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('requests', (table) => {
    table.boolean('is_human_taken_over').notNullable().defaultTo(false);
    table.timestamp('taken_over_at').defaultTo(null);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('requests', (table) => {
    table.dropColumn('taken_over_at');
    table.dropColumn('is_human_taken_over');
  });
};
