import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BrandHeader } from '@/components/BrandHeader'
import { palette } from '@/lib/theme'

const sections = [
  {
    title: 'Post a Tee Time',
    steps: [
      'Open Home and tap the floating plus button.',
      'Add the course, date, time, and player count.',
      'Choose whether the round is public, for connections, or inside a group.',
      'Publish it and golfers can request to join.'
    ]
  },
  {
    title: 'Join and Manage Groups',
    steps: [
      'Open Groups to create or discover communities.',
      'Open a group to see the board, members, and details.',
      'If you run the group, use the Members tab to invite people from your connections.'
    ]
  },
  {
    title: 'Build Connections',
    steps: [
      'Open Connections from your profile.',
      'Search golfers, send requests, and accept incoming requests.',
      'Once connected, they can show up in your network and group invites.'
    ]
  }
]

function SupportLink({
  icon,
  label,
  value,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.linkCard}>
      <View style={styles.linkIcon}>
        <Ionicons color={palette.aqua} name={icon} size={18} />
      </View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkLabel}>{label}</Text>
        <Text style={styles.linkValue}>{value}</Text>
      </View>
      <Ionicons color={palette.textMuted} name="chevron-forward" size={18} />
    </Pressable>
  )
}

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandHeader showBack title="Help & Support" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How the app works</Text>
          {sections.map((section) => (
            <View key={section.title} style={styles.card}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              {section.steps.map((step, index) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SupportLink
            icon="mail-outline"
            label="Email support"
            value="support@ultimategolfcommunity.com"
            onPress={() => void Linking.openURL('mailto:support@ultimategolfcommunity.com')}
          />
          <SupportLink
            icon="shield-checkmark-outline"
            label="Privacy policy"
            value="ultimategolfcommunity.com/privacy"
            onPress={() => void Linking.openURL('https://www.ultimategolfcommunity.com/privacy')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  content: {
    gap: 20,
    padding: 20
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24
  },
  stepBadgeText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700'
  },
  stepText: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 14,
    lineHeight: 21
  },
  linkCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 18
  },
  linkIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  linkCopy: {
    flex: 1,
    gap: 2
  },
  linkLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700'
  },
  linkValue: {
    color: palette.textMuted,
    fontSize: 13
  }
})
