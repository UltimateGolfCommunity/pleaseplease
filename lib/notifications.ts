type NotificationPayload = {
  userId?: string | null
  type: string
  title: string
  message: string
  relatedId?: string | null
  notificationData?: Record<string, unknown> | null
}

function isMissingColumnError(error: any, columnName: string) {
  if (!error) return false
  const source = `${error.message || ''} ${error.details || ''}`.toLowerCase()
  return source.includes(columnName.toLowerCase()) && (
    source.includes('column') ||
    source.includes('schema cache') ||
    source.includes('could not find')
  )
}

export async function savePushTokenForUser(
  supabase: any,
  {
    userId,
    expoPushToken
  }: {
    userId?: string | null
    expoPushToken?: string | null
  }
) {
  if (!userId || !expoPushToken) return

  const payload = {
    expo_push_token: expoPushToken,
    push_notifications_enabled: true,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(payload)
    .eq('id', userId)

  if (!error) return

  if (isMissingColumnError(error, 'push_notifications_enabled')) {
    const retry = await supabase
      .from('user_profiles')
      .update({
        expo_push_token: expoPushToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (!retry.error) return
    throw retry.error
  }

  throw error
}

export async function clearPushTokenForUser(
  supabase: any,
  {
    userId
  }: {
    userId?: string | null
  }
) {
  if (!userId) return

  const payload = {
    expo_push_token: null,
    push_notifications_enabled: false,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(payload)
    .eq('id', userId)

  if (!error) return

  if (isMissingColumnError(error, 'push_notifications_enabled')) {
    const retry = await supabase
      .from('user_profiles')
      .update({
        expo_push_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (!retry.error) return
    throw retry.error
  }

  throw error
}

export async function createNotificationAndDeliverPush(supabase: any, payload: NotificationPayload) {
  if (!payload.userId) return null

  const baseRecord = {
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    related_id: payload.relatedId || null,
    is_read: false
  }

  let notificationRecord: any = null

  const insertWithData = await supabase
    .from('notifications')
    .insert({
      ...baseRecord,
      notification_data: payload.notificationData || {}
    })
    .select()
    .single()

  if (!insertWithData.error) {
    notificationRecord = insertWithData.data
  } else {
    const insertWithoutData = await supabase
      .from('notifications')
      .insert(baseRecord)
      .select()
      .single()

    if (insertWithoutData.error) {
      throw insertWithoutData.error
    }

    notificationRecord = insertWithoutData.data
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('expo_push_token, push_notifications_enabled')
      .eq('id', payload.userId)
      .maybeSingle()

    if (profileError) {
      if (
        isMissingColumnError(profileError, 'expo_push_token') ||
        isMissingColumnError(profileError, 'push_notifications_enabled')
      ) {
        return notificationRecord
      }

      console.warn('⚠️ Unable to load push token for notification delivery:', profileError)
      return notificationRecord
    }

    const expoPushToken = profile?.expo_push_token
    const pushEnabled = profile?.push_notifications_enabled

    if (!expoPushToken || pushEnabled === false) {
      return notificationRecord
    }

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title: payload.title,
        body: payload.message,
        data: {
          notification_id: notificationRecord?.id,
          related_id: payload.relatedId || null,
          type: payload.type,
          ...(payload.notificationData || {})
        }
      })
    })
  } catch (pushError) {
    console.warn('⚠️ Push delivery failed after notification record creation:', pushError)
  }

  return notificationRecord
}
