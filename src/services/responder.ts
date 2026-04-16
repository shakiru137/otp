import { query } from './postgres'
import { sendSMS } from './notifications'

export const findNearestHub = async (lng: number, lat: number) => {
  const result = await query(
    `SELECT id, name, phone, state, lga,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance
     FROM responder_hubs
     WHERE is_active = true
     ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
     LIMIT 1`,
    [lng, lat]
  )

  return result.rows[0] || null
}

export const alertResponderHub = async (
  hub: { name: string; phone: string },
  sessionId: string,
  lat: number,
  lng: number
) => {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`
  const message = `OTS ALERT: Emergency reported. Session: ${sessionId}. Location: ${mapsLink}`
  await sendSMS(hub.phone, message)
  console.log(`Responder hub ${hub.name} alerted`)
}