/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
exports.up = function(knex) {
  return knex.schema.alterTable('sos_sessions', (t) => {
    t.uuid('responder_hub_id').nullable().references('id').inTable('responder_hubs')
  })
}

exports.down = function(knex) {
  return knex.schema.alterTable('sos_sessions', (t) => {
    t.dropColumn('responder_hub_id')
  })
}
