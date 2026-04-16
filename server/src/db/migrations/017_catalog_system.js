/**
 * Migration: 017_catalog_system
 *
 * Extends the system for the Business Catalog feature:
 * 1. services: add behavior, buttons, sort_order columns
 * 2. menu_node_type enum: add 'catalog_entry'
 * 3. menu_nodes: add catalog_node_id FK to services
 * 4. sessions: add current_catalog_node_id for catalog browsing state
 */
exports.up = async function (knex) {
  // 1. Extend services table for catalog behavior
  await knex.schema.alterTable('services', (table) => {
    table.jsonb('behavior').nullable().defaultTo(null);
    table.jsonb('buttons').nullable().defaultTo(null);
    table.integer('sort_order').notNullable().defaultTo(0);
  });

  // 2. Add 'catalog_entry' to the menu_node_type enum
  await knex.raw(`ALTER TYPE menu_node_type ADD VALUE IF NOT EXISTS 'catalog_entry'`);

  // 3. Add catalog_node_id to menu_nodes (references services root for catalog browsing)
  await knex.schema.alterTable('menu_nodes', (table) => {
    table
      .uuid('catalog_node_id')
      .nullable()
      .references('id')
      .inTable('services')
      .onDelete('SET NULL');
  });

  // 4. Add current_catalog_node_id to sessions for catalog browsing state
  await knex.schema.alterTable('sessions', (table) => {
    table.uuid('current_catalog_node_id').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('sessions', (table) => {
    table.dropColumn('current_catalog_node_id');
  });

  await knex.schema.alterTable('menu_nodes', (table) => {
    table.dropColumn('catalog_node_id');
  });

  await knex.schema.alterTable('services', (table) => {
    table.dropColumn('sort_order');
    table.dropColumn('buttons');
    table.dropColumn('behavior');
  });

  // Note: PostgreSQL does not support removing values from enums easily.
  // The 'catalog_entry' value will remain in the enum after rollback.
};
