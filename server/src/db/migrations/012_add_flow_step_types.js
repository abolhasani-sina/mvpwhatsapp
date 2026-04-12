/**
 * Migration: 012_add_flow_step_types
 * Adds missing step types to flow_step_type enum:
 * select_date, select_time, summary
 */

exports.up = async function (knex) {
  await knex.raw(`ALTER TYPE flow_step_type ADD VALUE IF NOT EXISTS 'select_date'`);
  await knex.raw(`ALTER TYPE flow_step_type ADD VALUE IF NOT EXISTS 'select_time'`);
  await knex.raw(`ALTER TYPE flow_step_type ADD VALUE IF NOT EXISTS 'summary'`);
};

exports.down = async function () {
  // PostgreSQL does not support removing enum values.
  // No-op: values remain but are unused if rolled back.
};
