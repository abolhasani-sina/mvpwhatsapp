/**
 * Migration: 003_create_templates
 * Phase 2 — Business Setup
 *
 * Creates the templates and template_data tables for the template engine.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('industry_type').notNullable();
    table.string('name').notNullable();
    table.text('description').defaultTo(null);
  });

  await knex.schema.createTable('template_data', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('template_id')
      .notNullable()
      .references('id')
      .inTable('templates')
      .onDelete('CASCADE');
    table.jsonb('data').notNullable();

    table.index(['template_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('template_data');
  await knex.schema.dropTableIfExists('templates');
};
