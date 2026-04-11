/**
 * Migration: 007_create_requests
 * Phase 5 — Request System (Core Data Model + Lifecycle)
 *
 * Creates:
 * - request_status enum
 * - requests table
 */

exports.up = async function (knex) {
  await knex.raw(`
    CREATE TYPE request_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'manual_followup',
      'completed'
    )
  `);

  await knex.schema.createTable('requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('business_id')
      .notNullable()
      .references('id')
      .inTable('businesses')
      .onDelete('CASCADE');
    table
      .uuid('source_flow_id')
      .defaultTo(null)
      .references('id')
      .inTable('flows')
      .onDelete('SET NULL');
    table
      .uuid('entered_from_node_id')
      .defaultTo(null)
      .references('id')
      .inTable('menu_nodes')
      .onDelete('SET NULL');
    table.jsonb('data').notNullable().defaultTo('{}');
    table
      .specificType('status', 'request_status')
      .notNullable()
      .defaultTo('pending');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['business_id', 'status']);
    table.index(['business_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('requests');
  await knex.raw('DROP TYPE IF EXISTS request_status');
};
