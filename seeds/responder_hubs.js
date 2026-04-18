exports.seed = async function(knex) {
  // Fix: use 'responder_hubs' not 'table_name'
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