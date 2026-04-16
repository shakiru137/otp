import axios from 'axios'
import admin from 'firebase-admin'
import { env } from '../config/env'

// Check if Firebase credentials are available
const hasFirebaseCreds = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_CLIENT_EMAIL &&
                          process.env.FIREBASE_PRIVATE_KEY

// Initialize Firebase Admin only if credentials exist
if (hasFirebaseCreds && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    })
    console.log('Firebase Admin initialized')
  } catch (err) {
    console.error('Firebase init failed:', err)
  }
} else if (!hasFirebaseCreds) {
  console.log('Firebase not configured — running in dev mode')
}

// Send SMS via Termii
export const sendSMS = async (phone: string, message: string) => {
  if (!env.TERMII_API_KEY) {
    console.log(`📱 [DEV] Would send SMS to ${phone}: ${message.substring(0, 50)}...`)
    return
  }

  try {
    await axios.post('https://api.ng.termii.com/api/sms/send', {
      to: phone,
      from: 'OTS Alert',
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: env.TERMII_API_KEY,
    })
    console.log(`SMS sent to ${phone}`)
  } catch (err: any) {
    console.error('Termii SMS error:', err?.response?.data || err.message)
  }
}

// Send FCM push notification
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  if (!hasFirebaseCreds) {
    console.log(`🔔 [DEV] Would send FCM to ${fcmToken.substring(0, 20)}...: ${title}`)
    return
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', contentAvailable: true } } }
    })
    console.log(`Push notification sent`)
  } catch (err: any) {
    console.error('FCM error:', err.message)
  }
}

// Notify all family contacts for a personal SOS
export const notifyFamilyContacts = async (
  contacts: { phone: string; name: string; fcm_token?: string }[],
  userId: string,
  sessionId: string,
  lat: number,
  lng: number
) => {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`
  const message = `EMERGENCY ALERT: Your contact needs help! Last known location: ${mapsLink}`

  await Promise.all(contacts.map(async (contact) => {
    await sendSMS(contact.phone, message)

    if (contact.fcm_token) {
      await sendPushNotification(
        contact.fcm_token,
        '🚨 Emergency Alert',
        `Your contact needs help now!`,
        { sessionId, userId, lat: String(lat), lng: String(lng) }
      )
    }
  }))
}