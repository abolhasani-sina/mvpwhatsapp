/**
 * Migration: 006_create_flows
 * Phase 4 — Flow System (Linear Data Collection Definition)
 *
 * Creates:
 * - flow_step_type enum
 * - flows table
 * - flow_steps table
 */

exports.up = async function (knex) {
  // Create step type enum (5 allowed types)
  await knex.raw(`
    CREATE TYPE flow_step_type AS ENUM (
      'text_input',
      'number_input',
      'select_option',
      'select_service',
      'confirm'
    )
  `);

  await knex.schema.createTable('flows', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('business_id')
      .notNullable()
      .references('id')
      .inTable('businesses')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description').defaultTo(null);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['business_id']);
  });

  await knex.schema.createTable('flow_steps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('flow_id')
      .notNullable()
      .references('id')
      .inTable('flows')
      .onDelete('CASCADE');
    table.integer('step_order').notNullable();
    table
      .specificType('type', 'flow_step_type')
      .notNullable();
    table.string('label').notNullable();
    table.jsonb('config').defaultTo('{}');
    table.boolean('is_required').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['flow_id', 'step_order']);
    table.index(['flow_id', 'step_order']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('flow_steps');
  await knex.schema.dropTableIfExists('flows');
  await knex.raw('DROP TYPE IF EXISTS flow_step_type');
};
