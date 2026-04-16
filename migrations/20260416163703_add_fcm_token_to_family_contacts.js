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
  return knex.schema.alterTable('family_contacts', (t) => {
    t.string('fcm_token')
  })
}

exports.down = function(knex) {
  return knex.schema.alterTable('family_contacts', (t) => {
    t.dropColumn('fcm_token')
  })
}