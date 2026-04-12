/**
 * Migration: 014_add_trigger_type_to_assignment_rules
 * Adds structured trigger_type + trigger_id columns to assignment_rules.
 * Keeps existing conditions column for backward compatibility.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('assignment_rules', (table) => {
    table.string('trigger_type').nullable(); // 'service', 'menu_node', 'flow'
    table.uuid('trigger_id').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('assignment_rules', (table) => {
    table.dropColumn('trigger_type');
    table.dropColumn('trigger_id');
  });
};
