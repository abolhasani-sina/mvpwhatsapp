/**
 * Migration: 002_create_services
 * Phase 2 — Business Setup
 *
 * Creates the services table for tenant-scoped business services.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('services', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('business_id')
      .notNullable()
      .references('id')
      .inTable('businesses')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description').defaultTo(null);
    table.decimal('price', 10, 2).defaultTo(null);
    table.string('duration').defaultTo(null);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['business_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('services');
};
