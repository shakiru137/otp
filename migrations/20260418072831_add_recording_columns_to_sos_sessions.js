exports.up = async function(knex) {
  const hasRecordingSid = await knex.schema.hasColumn('sos_sessions', 'recording_sid')
  const hasRecordingResourceId = await knex.schema.hasColumn('sos_sessions', 'recording_resource_id')
  const hasRecordingUrl = await knex.schema.hasColumn('sos_sessions', 'recording_url')

  await knex.schema.alterTable('sos_sessions', (t) => {
    if (!hasRecordingSid) t.string('recording_sid')
    if (!hasRecordingResourceId) t.string('recording_resource_id')
    if (!hasRecordingUrl) t.string('recording_url')
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable('sos_sessions', (t) => {
    t.dropColumns('recording_sid', 'recording_resource_id', 'recording_url')
  })
}