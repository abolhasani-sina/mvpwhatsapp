/**
 * Migration: 001_create_businesses_and_users
 * Phase 1 — Core Data & Structure
 *
 * Creates the foundational tables: businesses and users.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('businesses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('phone').notNullable();
    table.string('location').defaultTo(null);
    table.text('description').defaultTo(null);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['is_active']);
  });

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('business_id')
      .references('id')
      .inTable('businesses')
      .onDelete('SET NULL')
      .defaultTo(null);
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table
      .enu('role', ['platform_owner', 'business_owner'], {
        useNative: true,
        enumName: 'user_role',
      })
      .notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['business_id']);
    table.index(['email']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('businesses');
  await knex.raw('DROP TYPE IF EXISTS user_role');
};
