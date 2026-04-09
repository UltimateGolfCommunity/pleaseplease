import { Pressable, StyleSheet, Text, View } from 'react-native'
import { palette } from '@/lib/theme'

export function StatCard({
  label,
  value,
  detail,
  onPress
}: {
  label: string
  value: string
  detail?: string
  onPress?: () => void
}) {
  const Wrapper = onPress ? Pressable : View

  return (
    <Wrapper onPress={onPress} style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    padding: 18
  },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  value: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700'
  },
  detail: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
})
