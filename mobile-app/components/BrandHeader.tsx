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
  logoScale?: number
  leftIconName?: keyof typeof Ionicons.glyphMap
  onLeftPress?: () => void
  rightIconName?: keyof typeof Ionicons.glyphMap
  onRightPress?: () => void
}

export function BrandHeader({
  title,
  subtitle,
  showLogo = true,
  showBack = false,
  largeLogo = false,
  logoScale = 1,
  leftIconName,
  onLeftPress,
  rightIconName,
  onRightPress
}: BrandHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={palette.text} name="chevron-back" size={22} />
        </Pressable>
      ) : leftIconName && onLeftPress ? (
        <Pressable onPress={onLeftPress} style={styles.backButton}>
          <Ionicons color={palette.text} name={leftIconName} size={20} />
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
          style={[
            styles.logo,
            largeLogo && styles.logoLarge,
            logoScale !== 1 && { transform: [{ scale: logoScale }] }
          ]}
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
    minHeight: 72,
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
    top: 2,
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
    top: 2,
    width: 42,
    zIndex: 5
  },
  logo: {
    alignSelf: 'center',
    height: 64,
    marginBottom: -24,
    marginTop: -12,
    width: 264
  },
  logoLarge: {
    height: 122,
    marginBottom: -44,
    marginLeft: 8,
    marginTop: -36,
    width: 360
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
