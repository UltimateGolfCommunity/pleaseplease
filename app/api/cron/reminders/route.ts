import { NextRequest, NextResponse } from 'next/server'
import { createNotificationAndDeliverPush } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function chicagoDatePlusOneDay() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now)
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ''
  const chicagoToday = new Date(`${value('year')}-${value('month')}-${value('day')}T12:00:00`)
  chicagoToday.setDate(chicagoToday.getDate() + 1)
  return `${chicagoToday.getFullYear()}-${String(chicagoToday.getMonth() + 1).padStart(2, '0')}-${String(chicagoToday.getDate()).padStart(2, '0')}`
}

function displayDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')

  // Vercel sends this header for scheduled invocations. Never leave the
  // reminder sender publicly callable in production.
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const reminderDate = chicagoDatePlusOneDay()

    const [{ data: tournaments, error: tournamentsError }, { data: teeTimes, error: teeTimesError }] = await Promise.all([
      supabase
        .from('golf_groups')
        .select('id, name, tournament_date, creator_id')
        .eq('group_type', 'tournament')
        .eq('tournament_date', reminderDate),
      supabase
        .from('tee_times')
        .select('id, creator_id, course_name, tee_time_date, tee_time_time')
        .eq('tee_time_date', reminderDate)
    ])

    if (tournamentsError) throw tournamentsError
    if (teeTimesError) throw teeTimesError

    const tournamentIds = (tournaments || []).map((tournament: any) => tournament.id).filter(Boolean)
    const teeTimeIds = (teeTimes || []).map((teeTime: any) => teeTime.id).filter(Boolean)

    const [{ data: memberships }, { data: teeTimePlayers }, { data: sentReminders }] = await Promise.all([
      tournamentIds.length
        ? supabase.from('group_members').select('group_id, user_id').in('group_id', tournamentIds).eq('status', 'active')
        : Promise.resolve({ data: [] as any[] }),
      teeTimeIds.length
        ? supabase.from('tee_time_applications').select('tee_time_id, applicant_id').in('tee_time_id', teeTimeIds).in('status', ['approved', 'accepted'])
        : Promise.resolve({ data: [] as any[] }),
      [...tournamentIds, ...teeTimeIds].length
        ? supabase.from('notifications').select('user_id, type, related_id').in('related_id', [...tournamentIds, ...teeTimeIds]).in('type', ['tournament_reminder', 'tee_time_reminder'])
        : Promise.resolve({ data: [] as any[] })
    ])

    const alreadySent = new Set((sentReminders || []).map((notification: any) => `${notification.type}:${notification.related_id}:${notification.user_id}`))
    const tournamentMembers = new Map<string, Set<string>>()
    ;(memberships || []).forEach((member: any) => {
      if (!member.group_id || !member.user_id) return
      const recipients = tournamentMembers.get(member.group_id) || new Set<string>()
      recipients.add(member.user_id)
      tournamentMembers.set(member.group_id, recipients)
    })
    ;(tournaments || []).forEach((tournament: any) => {
      if (!tournament.creator_id) return
      const recipients = tournamentMembers.get(tournament.id) || new Set<string>()
      recipients.add(tournament.creator_id)
      tournamentMembers.set(tournament.id, recipients)
    })

    const teeTimeParticipants = new Map<string, Set<string>>()
    ;(teeTimePlayers || []).forEach((player: any) => {
      if (!player.tee_time_id || !player.applicant_id) return
      const recipients = teeTimeParticipants.get(player.tee_time_id) || new Set<string>()
      recipients.add(player.applicant_id)
      teeTimeParticipants.set(player.tee_time_id, recipients)
    })
    ;(teeTimes || []).forEach((teeTime: any) => {
      if (!teeTime.creator_id) return
      const recipients = teeTimeParticipants.get(teeTime.id) || new Set<string>()
      recipients.add(teeTime.creator_id)
      teeTimeParticipants.set(teeTime.id, recipients)
    })

    const deliveries: Promise<unknown>[] = []
    ;(tournaments || []).forEach((tournament: any) => {
      const recipients = tournamentMembers.get(tournament.id) || new Set<string>()
      recipients.forEach((userId) => {
        if (alreadySent.has(`tournament_reminder:${tournament.id}:${userId}`)) return
        deliveries.push(createNotificationAndDeliverPush(supabase, {
          userId,
          type: 'tournament_reminder',
          title: 'Tournament tomorrow',
          message: `${tournament.name || 'Your tournament'} begins tomorrow, ${displayDate(reminderDate)}.`,
          relatedId: tournament.id,
          notificationData: { group_id: tournament.id, tournament_date: reminderDate }
        }))
      })
    })
    ;(teeTimes || []).forEach((teeTime: any) => {
      const recipients = teeTimeParticipants.get(teeTime.id) || new Set<string>()
      recipients.forEach((userId) => {
        if (alreadySent.has(`tee_time_reminder:${teeTime.id}:${userId}`)) return
        const time = teeTime.tee_time_time ? ` at ${teeTime.tee_time_time}` : ''
        deliveries.push(createNotificationAndDeliverPush(supabase, {
          userId,
          type: 'tee_time_reminder',
          title: 'Tee time tomorrow',
          message: `${teeTime.course_name || 'Your round'} is tomorrow${time}.`,
          relatedId: teeTime.id,
          notificationData: { tee_time_id: teeTime.id, tee_time_date: reminderDate }
        }))
      })
    })

    const results = await Promise.allSettled(deliveries)
    return NextResponse.json({
      success: true,
      reminder_date: reminderDate,
      delivered: results.filter((result) => result.status === 'fulfilled').length,
      failed: results.filter((result) => result.status === 'rejected').length
    })
  } catch (error) {
    console.error('Unable to send scheduled reminders:', error)
    return NextResponse.json({ error: 'Unable to send scheduled reminders' }, { status: 500 })
  }
}
