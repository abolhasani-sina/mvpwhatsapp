/**
 * Migration: 016_builder_fixes
 *
 * 1. Add parent_id to services (sub-categories)
 * 2. Add published_at to businesses (publish system)
 */
exports.up = async function (knex) {
  // 1. Services: add parent_id for sub-categories
  await knex.schema.alterTable('services', (table) => {
    table
      .uuid('parent_id')
      .nullable()
      .references('id')
      .inTable('services')
      .onDelete('CASCADE');
  });

  // 2. Businesses: track last publish timestamp
  await knex.schema.alterTable('businesses', (table) => {
    table.timestamp('published_at').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('businesses', (table) => {
    table.dropColumn('published_at');
  });
  await knex.schema.alterTable('services', (table) => {
    table.dropColumn('parent_id');
  });
};
