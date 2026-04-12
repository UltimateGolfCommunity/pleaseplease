import { useEffect, useRef } from 'react'
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native'
import { palette } from '@/lib/theme'

export function AppLaunchScreen() {
  const ballTravel = useRef(new Animated.Value(0)).current
  const ballSink = useRef(new Animated.Value(0)).current
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ballTravel, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(ballTravel, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true
        })
      ])
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(ballSink, {
          toValue: 1,
          duration: 250,
          delay: 1280,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(ballSink, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ])
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true
        })
      ])
    ).start()
  }, [ballSink, ballTravel, shimmer])

  const ballTranslateX = ballTravel.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 108]
  })

  const ballTranslateY = ballSink.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18]
  })

  const ballScale = ballSink.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.35]
  })

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.16, 0.4, 0.16]
  })

  return (
    <View style={styles.overlay}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <Animated.View style={[styles.shimmerBand, { opacity: shimmerOpacity }]} />

      <View style={styles.content}>
        <Image source={require('@/assets/ugc-logo.png')} resizeMode="contain" style={styles.logo} />
        <Text style={styles.title}>The tee sheet is warming up</Text>
        <Text style={styles.subtitle}>Rolling your next round into place.</Text>

        <View style={styles.animationStage}>
          <View style={styles.track} />
          <Animated.View
            style={[
              styles.ball,
              {
                transform: [{ translateX: ballTranslateX }, { translateY: ballTranslateY }, { scale: ballScale }]
              }
            ]}
          />
          <View style={styles.holeShadow} />
          <View style={styles.hole} />
          <View style={styles.flagStem} />
          <View style={styles.flag} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: palette.bg,
    justifyContent: 'center'
  },
  glowOne: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderRadius: 220,
    height: 240,
    left: -60,
    position: 'absolute',
    top: 110,
    width: 240
  },
  glowTwo: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 260,
    bottom: 120,
    height: 280,
    position: 'absolute',
    right: -80,
    width: 280
  },
  shimmerBand: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 220,
    position: 'absolute',
    transform: [{ rotate: '-22deg' }],
    width: 420
  },
  content: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 28
  },
  logo: {
    height: 108,
    width: 260
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  animationStage: {
    height: 120,
    justifyContent: 'center',
    marginTop: 24,
    width: 280
  },
  track: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    height: 6,
    width: 236
  },
  ball: {
    backgroundColor: palette.white,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    left: 136,
    position: 'absolute',
    top: 49,
    width: 22
  },
  holeShadow: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    height: 16,
    position: 'absolute',
    right: 18,
    top: 51,
    width: 20
  },
  hole: {
    backgroundColor: '#020705',
    borderRadius: 999,
    height: 12,
    position: 'absolute',
    right: 20,
    top: 53,
    width: 16
  },
  flagStem: {
    backgroundColor: 'rgba(255,255,255,0.66)',
    height: 38,
    position: 'absolute',
    right: 26,
    top: 16,
    width: 2
  },
  flag: {
    backgroundColor: palette.aqua,
    borderRadius: 3,
    height: 12,
    position: 'absolute',
    right: 28,
    top: 18,
    width: 20
  }
})
