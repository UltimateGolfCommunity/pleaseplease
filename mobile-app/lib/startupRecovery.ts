import AsyncStorage from '@react-native-async-storage/async-storage'
import { clearMobileAuthStorage } from '@/lib/supabase'

const BOOT_STATE_KEY = 'ugc:mobile:boot-state'
const LAST_RECOVERY_KEY = 'ugc:mobile:last-recovery'

type BootState = {
  status: 'starting' | 'healthy'
  startedAt: number
  version: number
}

const BOOT_STATE_VERSION = 1
const STALE_BOOT_MS = 60 * 1000

async function readBootState() {
  try {
    const rawState = await AsyncStorage.getItem(BOOT_STATE_KEY)
    return rawState ? (JSON.parse(rawState) as BootState) : null
  } catch {
    return null
  }
}

export async function prepareMobileBoot() {
  const previousBoot = await readBootState()
  const now = Date.now()
  const previousBootCrashed =
    previousBoot?.status === 'starting' && now - previousBoot.startedAt < STALE_BOOT_MS

  if (previousBootCrashed) {
    await clearMobileAuthStorage()
    await AsyncStorage.setItem(
      LAST_RECOVERY_KEY,
      JSON.stringify({
        recoveredAt: now,
        reason: 'Previous app launch did not reach a healthy state.'
      })
    )
  }

  await AsyncStorage.setItem(
    BOOT_STATE_KEY,
    JSON.stringify({
      status: 'starting',
      startedAt: now,
      version: BOOT_STATE_VERSION
    })
  )

  return { recoveredFromPreviousCrash: previousBootCrashed }
}

export async function markMobileBootHealthy() {
  await AsyncStorage.setItem(
    BOOT_STATE_KEY,
    JSON.stringify({
      status: 'healthy',
      startedAt: Date.now(),
      version: BOOT_STATE_VERSION
    })
  )
}
