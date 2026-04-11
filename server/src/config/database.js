const knex = require('knex');
const knexfile = require('../db/knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

module.exports = db;
