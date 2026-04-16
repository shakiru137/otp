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
  return knex.schema.raw('CREATE EXTENSION IF NOT EXISTS postgis').then(() => {
    return knex.schema.createTable('responder_hubs', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
      t.string('name').notNullable()
      t.string('phone').notNullable()
      t.string('state')
      t.string('lga')
      t.specificType('location', 'geography(Point, 4326)')
      t.boolean('is_active').defaultTo(true)
      t.timestamps(true, true)
    })
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('responder_hubs')
}

exports.seed = async function(knex) {
  await knex('responder_hubs').del()
  await knex.raw(`
    INSERT INTO responder_hubs (name, phone, state, lga, location) VALUES
    ('Lagos Central Hub', '07001234567', 'Lagos', 'Lagos Island',
      ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326)),
    ('Abuja Hub', '07007654321', 'FCT', 'Municipal',
      ST_SetSRID(ST_MakePoint(7.4898, 9.0579), 4326)),
    ('Port Harcourt Hub', '07009876543', 'Rivers', 'Port Harcourt',
      ST_SetSRID(ST_MakePoint(7.0134, 4.8156), 4326))
  `)
}