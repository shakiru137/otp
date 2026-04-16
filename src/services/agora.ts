import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { env } from '../config/env'

export const generateAgoraToken = (channel: string, uid: number = 0) => {
  const expiryTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour

  const token = RtcTokenBuilder.buildTokenWithUid(
    env.AGORA_APP_ID,
    env.AGORA_APP_CERT,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expiryTime,
    expiryTime
  )

  return token
}