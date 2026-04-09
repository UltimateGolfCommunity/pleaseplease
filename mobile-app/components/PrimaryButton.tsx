import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { palette } from '@/lib/theme'

export function PrimaryButton({
  label,
  variant = 'solid',
  onPress,
  disabled = false,
  loading = false
}: {
  label: string
  variant?: 'solid' | 'ghost'
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variant === 'ghost' ? styles.ghost : styles.solid,
        (disabled || loading) && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? palette.text : palette.bg} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' ? styles.ghostLabel : styles.solidLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20
  },
  solid: {
    backgroundColor: palette.white
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderWidth: 1
  },
  disabled: {
    opacity: 0.55
  },
  label: {
    fontSize: 15,
    fontWeight: '700'
  },
  solidLabel: {
    color: palette.bg
  },
  ghostLabel: {
    color: palette.text
  }
})
