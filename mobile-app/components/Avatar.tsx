import { Image, StyleSheet, Text, View } from 'react-native'
import { palette } from '@/lib/theme'

type AvatarProps = {
  uri?: string | null
  label?: string
  size?: number
  shape?: 'circle' | 'rounded'
}

function getInitials(label?: string) {
  const parts = (label || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return 'UG'
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('')
}

export function Avatar({ uri, label, size = 96, shape = 'circle' }: AvatarProps) {
  const radius = shape === 'circle' ? size / 2 : Math.max(18, Math.round(size * 0.26))
  const initials = getInitials(label)

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: radius,
          height: size,
          width: size
        }
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            borderRadius: radius,
            height: size,
            width: size
          }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              borderRadius: radius,
              height: size,
              width: size
            }
          ]}
        >
          <Text style={[styles.initials, { fontSize: Math.max(16, Math.round(size * 0.28)) }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderWidth: 1,
    overflow: 'hidden'
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    justifyContent: 'center'
  },
  initials: {
    color: palette.text,
    fontWeight: '700',
    letterSpacing: 0.8
  }
})
