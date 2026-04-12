/**
 * Migration: 013_add_phone_number_to_requests
 * Adds phone_number column to requests table.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('requests', (table) => {
    table.string('phone_number').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('requests', (table) => {
    table.dropColumn('phone_number');
  });
};
