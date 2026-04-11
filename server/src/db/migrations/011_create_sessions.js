/**
 * Migration: 011_create_sessions
 * Phase 7 — WhatsApp Integration
 *
 * Creates:
 * - session_mode enum (automated, human_takeover)
 * - sessions table
 */

exports.up = async function (knex) {
  await knex.raw(`
    CREATE TYPE session_mode AS ENUM ('automated', 'human_takeover')
  `);

  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('phone_number').notNullable();
    table
      .uuid('business_id')
      .notNullable()
      .references('id')
      .inTable('businesses')
      .onDelete('CASCADE');
    table
      .uuid('current_menu_node_id')
      .defaultTo(null)
      .references('id')
      .inTable('menu_nodes')
      .onDelete('SET NULL');
    table
      .uuid('current_flow_id')
      .defaultTo(null)
      .references('id')
      .inTable('flows')
      .onDelete('SET NULL');
    table.integer('current_flow_step').defaultTo(null);
    table.jsonb('flow_data').defaultTo(null);
    table
      .specificType('mode', 'session_mode')
      .notNullable()
      .defaultTo('automated');
    table.timestamp('last_activity').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['phone_number', 'business_id']);
    table.index(['business_id']);
    table.index(['phone_number', 'business_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sessions');
  await knex.raw('DROP TYPE IF EXISTS session_mode');
};
