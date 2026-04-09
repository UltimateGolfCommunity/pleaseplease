import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { palette } from '@/lib/theme'

type BrandHeaderProps = {
  title?: string
  subtitle?: string
  showLogo?: boolean
  showBack?: boolean
  largeLogo?: boolean
  rightIconName?: keyof typeof Ionicons.glyphMap
  onRightPress?: () => void
}

export function BrandHeader({
  title,
  subtitle,
  showLogo = true,
  showBack = false,
  largeLogo = false,
  rightIconName,
  onRightPress
}: BrandHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={palette.text} name="chevron-back" size={22} />
        </Pressable>
      ) : null}
      {rightIconName && onRightPress ? (
        <Pressable onPress={onRightPress} style={styles.rightButton}>
          <Ionicons color={palette.text} name={rightIconName} size={20} />
        </Pressable>
      ) : null}
      {showLogo ? (
        <Image
          source={require('@/assets/ugc-logo.png')}
          style={[styles.logo, largeLogo && styles.logoLarge]}
          resizeMode="contain"
        />
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 0,
    width: '100%'
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 10,
    width: 42,
    zIndex: 5
  },
  rightButton: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 10,
    width: 42,
    zIndex: 5
  },
  logo: {
    alignSelf: 'center',
    height: 82,
    marginBottom: -18,
    marginTop: -20,
    width: 320
  },
  logoLarge: {
    height: 172,
    marginBottom: -48,
    marginLeft: 12,
    marginTop: -50,
    width: 520
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: 6,
    textAlign: 'center'
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center'
  }
})
