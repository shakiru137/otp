import axios from 'axios'
import { env } from '../config/env'

const AGORA_API_URL = 'https://api.agora.io/v1'

interface RecordingConfig {
  channel: string
  uid: number
  token: string
  storageConfig: {
    vendor: number
    region: number
    bucket: string
    accessKey: string
    secretKey: string
    fileNamePrefix: string[]
  }
}

// Start cloud recording
export const startCloudRecording = async (
  channel: string,
  uid: number = 0,
  token: string
): Promise<{ sid: string; resourceId: string } | null> => {
  // Dev Mode - No Real Credentials
  if (!env.AGORA_APP_CERT || !env.AWS_ACCESS_KEY_ID) {
    console.log(`🎥 [DEV] Would start recording for Channel: ${channel}`)
    console.log(`   Token: ${token.substring(0, 20)}...`)
    return { sid: 'dev-sid', resourceId: 'dev-resource' }
  }

  try {
    // Get resource ID first
    const resourceRes = await axios.post(
      `${AGORA_API_URL}/${env.AGORA_APP_ID}/cloud_recording/acquire`,
      {
        cname: channel,
        uid: String(uid),
        clientRequest: {
          resourceExpiredHour: 24,
          scene: 0
        }
      },
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${env.AGORA_APP_ID}:${env.AGORA_APP_CERT}`).toString('base64'),
          'Content-Type': 'application/json'
        }
      }
    )

    const resourceId = resourceRes.data.resourceId

    // Start recording
    const startRes = await axios.post(
      `${AGORA_API_URL}/${env.AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
      {
        cname: channel,
        uid: String(uid),
        clientRequest: {
          token,
          recordingConfig: {
            maxIdleTime: 30,
            streamTypes: 2,
            channelType: 0,
            VideoStreamType: 0,
            TranscodingConfig: {
              height: 640,
              width: 360,
              bitrate: 500,
              fps: 15,
              mixedVideoLayout: 1,
              backgroundColor: '#000000'
            }
          },
          RecordingFileConfig: {
            avFileType: ['hls', 'mp4']
          },
          StorageConfig: {
            vendor: 1,
            region: parseInt(env.AWS_REGION || 'us-east-1'),
            bucket: env.AWS_S3_BUCKET,
            accessKey: env.AWS_ACCESS_KEY_ID!,
            secretKey: env.AWS_SECRET_ACCESS_KEY!,
            fileNamePrefix: ['ots-recordings', channel]
          }
        }
      },
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${env.AGORA_APP_ID}:${env.AGORA_APP_CERT}`).toString('base64'),
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Cloud recording started:', startRes.data.sid)
    return {
      sid: startRes.data.sid,
      resourceId: resourceId
    }
  } catch (err: any) {
    console.error('Failed to start recording:', err?.response?.data || err.message)
    return null
  }
}

// Stop cloud recording
export const stopCloudRecording = async (
  resourceId: string,
  sid: string,
  channel: string,
  uid: number = 0
): Promise<{ fileList: string[]; serverResponse: any } | null> => {
  // Dev Mode - No Real Credentials
  if (sid === 'dev-sid') {
    console.log(`🎥 [DEV] Would stop recording for Channel: ${channel}`)
    return { 
      fileList: [`s3://${env.AWS_S3_BUCKET}/ots-recordings/${channel}/dev-recording.mp4`], 
      serverResponse: {} 
    }
  }

  try {
    const res = await axios.post(
      `${AGORA_API_URL}/${env.AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
      {
        cname: channel,
        uid: String(uid),
        clientRequest: {}
      },
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${env.AGORA_APP_ID}:${env.AGORA_APP_CERT}`).toString('base64'),
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Cloud recording stopped:', res.data)
    return {
      fileList: res.data.serverResponse?.fileList || [],
      serverResponse: res.data.serverResponse
    }
  } catch (err: any) {
    console.error('Failed to stop recording:', err?.response?.data || err.message)
    return null
  }
}