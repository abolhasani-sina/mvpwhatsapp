/**
 * Migration: 005_create_menu_nodes
 * Phase 3 — Menu System (Navigation Only)
 *
 * Creates the menu_nodes table for the recursive menu tree.
 * Also creates info_contents and action_buttons tables.
 */

exports.up = async function (knex) {
  // Create node_type enum
  await knex.raw(`
    CREATE TYPE menu_node_type AS ENUM ('menu', 'info', 'flow_entry', 'action')
  `);

  // Create action_type enum for action nodes
  await knex.raw(`
    CREATE TYPE menu_action_type AS ENUM ('show_phone', 'show_location', 'open_link', 'go_back')
  `);

  // Create behavior_type enum for action buttons on info nodes
  await knex.raw(`
    CREATE TYPE button_behavior_type AS ENUM ('trigger_flow', 'action')
  `);

  await knex.schema.createTable('menu_nodes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('business_id')
      .notNullable()
      .references('id')
      .inTable('businesses')
      .onDelete('CASCADE');
    table
      .uuid('parent_id')
      .defaultTo(null)
      .references('id')
      .inTable('menu_nodes')
      .onDelete('CASCADE');
    table
      .specificType('node_type', 'menu_node_type')
      .notNullable();
    table.string('label').notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table
      .specificType('action_type', 'menu_action_type')
      .defaultTo(null);
    table.jsonb('action_config').defaultTo(null);
    table.uuid('flow_id').defaultTo(null); // FK added in Phase 4 when flows table exists
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['business_id', 'parent_id']);
    table.index(['business_id']);
  });

  await knex.schema.createTable('info_contents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('menu_node_id')
      .notNullable()
      .references('id')
      .inTable('menu_nodes')
      .onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').defaultTo(null);
    table.decimal('price', 10, 2).defaultTo(null);
    table.string('duration').defaultTo(null);

    table.index(['menu_node_id']);
  });

  await knex.schema.createTable('action_buttons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('menu_node_id')
      .notNullable()
      .references('id')
      .inTable('menu_nodes')
      .onDelete('CASCADE');
    table.string('label').notNullable();
    table
      .specificType('behavior_type', 'button_behavior_type')
      .notNullable();
    table.uuid('flow_id').defaultTo(null); // FK added in Phase 4
    table
      .specificType('action_type', 'menu_action_type')
      .defaultTo(null);
    table.jsonb('action_config').defaultTo(null);
    table.integer('sort_order').notNullable().defaultTo(0);

    table.index(['menu_node_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('action_buttons');
  await knex.schema.dropTableIfExists('info_contents');
  await knex.schema.dropTableIfExists('menu_nodes');
  await knex.raw('DROP TYPE IF EXISTS button_behavior_type');
  await knex.raw('DROP TYPE IF EXISTS menu_action_type');
  await knex.raw('DROP TYPE IF EXISTS menu_node_type');
};
