// Utility functions for logging user activities

export interface ActivityData {
  user_id: string
  activity_type: string
  title: string
  description?: string
  related_id?: string
  related_type?: string
  metadata?: Record<string, any>
}

export async function logActivity(activityData: ActivityData): Promise<boolean> {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData)
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('Error logging activity:', error)
    return false
  }
}

// Convenience functions for common activities
export async function logProfileUpdate(userId: string, fields: string[]): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'profile_updated',
    title: 'Updated Profile',
    description: `Updated: ${fields.join(', ')}`,
    metadata: { fields_updated: fields }
  })
}

export async function logTeeTimeCreated(userId: string, teeTimeId: string, courseName: string): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'tee_time_created',
    title: 'Created Tee Time',
    description: `Created a new tee time at ${courseName}`,
    related_id: teeTimeId,
    related_type: 'tee_time',
    metadata: { course_name: courseName }
  })
}

export async function logTeeTimeApplied(userId: string, teeTimeId: string, courseName: string): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'tee_time_applied',
    title: 'Applied to Tee Time',
    description: `Applied to tee time at ${courseName}`,
    related_id: teeTimeId,
    related_type: 'tee_time',
    metadata: { course_name: courseName }
  })
}

export async function logGroupJoined(userId: string, groupId: string, groupName: string): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'group_joined',
    title: 'Joined Group',
    description: `Joined the group "${groupName}"`,
    related_id: groupId,
    related_type: 'group',
    metadata: { group_name: groupName }
  })
}

export async function logGroupCreated(userId: string, groupId: string, groupName: string): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'group_created',
    title: 'Created Group',
    description: `Created the group "${groupName}"`,
    related_id: groupId,
    related_type: 'group',
    metadata: { group_name: groupName }
  })
}

export async function logRoundLogged(userId: string, courseName: string, score: number): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'round_logged',
    title: 'Logged Round',
    description: `Logged a round at ${courseName} (Score: ${score})`,
    metadata: { course_name: courseName, score }
  })
}

export async function logConnectionRequested(userId: string, targetUserId: string, targetUserName: string): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'connection_requested',
    title: 'Requested Connection',
    description: `Requested connection with ${targetUserName}`,
    related_id: targetUserId,
    related_type: 'user',
    metadata: { target_user_name: targetUserName }
  })
}

export async function logConnectionAccepted(userId: string, targetUserId: string, targetUserName: string): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'connection_accepted',
    title: 'Accepted Connection',
    description: `Accepted connection request from ${targetUserName}`,
    related_id: targetUserId,
    related_type: 'user',
    metadata: { target_user_name: targetUserName }
  })
}

export async function logBadgeEarned(userId: string, badgeName: string, badgeDescription: string): Promise<boolean> {
  return logActivity({
    user_id: userId,
    activity_type: 'badge_earned',
    title: 'Earned Badge',
    description: `Earned the "${badgeName}" badge`,
    metadata: { badge_name: badgeName, badge_description: badgeDescription }
  })
}
