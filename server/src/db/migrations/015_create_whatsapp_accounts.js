/**
 * Migration: 015_create_whatsapp_accounts
 * Maps WhatsApp phone_number_id to business_id for multi-business routing.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('whatsapp_accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('business_id')
      .notNullable()
      .references('id')
      .inTable('businesses')
      .onDelete('CASCADE');
    table.string('phone_number_id').notNullable().unique();
    table.string('display_name').defaultTo(null);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['phone_number_id']);
    table.index(['business_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('whatsapp_accounts');
};
