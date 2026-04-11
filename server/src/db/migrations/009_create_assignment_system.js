/**
 * Phase 6 — Assignment System
 * Creates assignees table, assignment_rules table,
 * and adds assignment columns to requests.
 */

exports.up = async function (knex) {
  // 1. Assignees table
  await knex.schema.createTable('assignees', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 2. Assignment rules table
  await knex.schema.createTable('assignment_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name').notNullable();
    table.integer('priority').notNullable().defaultTo(0);
    table.jsonb('conditions').notNullable().defaultTo('{}');
    table.uuid('assignee_id').notNullable().references('id').inTable('assignees').onDelete('CASCADE');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // 3. Add assignment columns to requests
  await knex.schema.alterTable('requests', (table) => {
    table.uuid('assigned_to_id').nullable().references('id').inTable('assignees').onDelete('SET NULL');
    table.uuid('assignment_rule_id').nullable().references('id').inTable('assignment_rules').onDelete('SET NULL');
    table.timestamp('assigned_at').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('requests', (table) => {
    table.dropColumn('assigned_to_id');
    table.dropColumn('assignment_rule_id');
    table.dropColumn('assigned_at');
  });

  await knex.schema.dropTableIfExists('assignment_rules');
  await knex.schema.dropTableIfExists('assignees');
};
