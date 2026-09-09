import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

export function AppLaunchScreen() {
  const ballTravel = useRef(new Animated.Value(0)).current
  const flagSway = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const ballLoop = Animated.loop(Animated.sequence([
      Animated.delay(350),
      Animated.timing(ballTravel, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(260),
      Animated.timing(ballTravel, { toValue: 0, duration: 0, useNativeDriver: true })
    ]))
    const flagLoop = Animated.loop(Animated.sequence([
      Animated.timing(flagSway, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(flagSway, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ]))

    ballLoop.start()
    flagLoop.start()
    return () => {
      ballLoop.stop()
      flagLoop.stop()
    }
  }, [ballTravel, flagSway])

  const ballTranslateX = ballTravel.interpolate({ inputRange: [0, 1], outputRange: [-103, 103] })
  const ballTranslateY = ballTravel.interpolate({ inputRange: [0, 0.55, 0.88, 1], outputRange: [5, -7, -2, 9] })
  const ballScale = ballTravel.interpolate({ inputRange: [0, 0.88, 1], outputRange: [1, 1, 0.3] })
  const flagRotate = flagSway.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] })

  return (
    <View style={styles.overlay}>
      <View style={styles.sky} />
      <View style={styles.cloudOne} />
      <View style={styles.cloudTwo} />
      <View style={styles.horizonGlow} />
      <View style={styles.green} />
      <View style={styles.mowStripeOne} />
      <View style={styles.mowStripeTwo} />

      <View style={styles.content}>
        <View style={styles.puttStage}>
          <View style={styles.puttLine} />
          <View style={styles.puttLineHighlight} />
          <View style={styles.cupShadow} />
          <View style={styles.cup} />
          <View style={styles.flagPole} />
          <Animated.View style={[styles.flag, { transform: [{ rotate: flagRotate }] }]} />
          <Animated.View style={[styles.ball, { transform: [{ translateX: ballTranslateX }, { translateY: ballTranslateY }, { scale: ballScale }] }]}>
            <View style={styles.ballDimpleOne} />
            <View style={styles.ballDimpleTwo} />
            <View style={styles.ballDimpleThree} />
          </Animated.View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', backgroundColor: '#8bcdf0', justifyContent: 'center', overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#73bce1' },
  cloudOne: { backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: 160, height: 190, left: -74, position: 'absolute', top: 112, width: 300 },
  cloudTwo: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 160, height: 210, position: 'absolute', right: -108, top: 230, width: 280 },
  horizonGlow: { backgroundColor: 'rgba(255,246,207,0.38)', borderRadius: 999, height: 230, position: 'absolute', top: '37%', width: 360 },
  green: { backgroundColor: '#367e58', borderRadius: 999, bottom: -180, height: 460, position: 'absolute', width: '150%' },
  mowStripeOne: { backgroundColor: 'rgba(158,220,110,0.15)', bottom: 52, height: 66, position: 'absolute', transform: [{ rotate: '-8deg' }], width: '150%' },
  mowStripeTwo: { backgroundColor: 'rgba(15,81,48,0.2)', bottom: 164, height: 52, position: 'absolute', transform: [{ rotate: '-8deg' }], width: '150%' },
  content: { alignItems: 'center', width: '100%' },
  puttStage: { height: 116, position: 'relative', width: 286 },
  puttLine: { alignSelf: 'center', backgroundColor: 'rgba(247,255,243,0.25)', borderRadius: 99, height: 8, position: 'absolute', top: 52, width: 246 },
  puttLineHighlight: { alignSelf: 'center', backgroundColor: 'rgba(210,247,206,0.42)', borderRadius: 99, height: 2, position: 'absolute', top: 55, width: 225 },
  cupShadow: { backgroundColor: 'rgba(6,45,28,0.42)', borderRadius: 99, height: 18, position: 'absolute', right: 15, top: 47, width: 23 },
  cup: { backgroundColor: '#123b2b', borderColor: 'rgba(255,255,255,0.28)', borderRadius: 99, borderWidth: 1, height: 12, position: 'absolute', right: 18, top: 50, width: 17 },
  flagPole: { backgroundColor: 'rgba(250,255,248,0.86)', height: 40, position: 'absolute', right: 25, top: 12, width: 2 },
  flag: { backgroundColor: '#f8d477', borderBottomRightRadius: 4, borderTopRightRadius: 4, height: 13, position: 'absolute', right: 26, top: 14, width: 22 },
  ball: { alignItems: 'center', backgroundColor: '#fffef8', borderColor: 'rgba(31,68,52,0.28)', borderRadius: 99, borderWidth: 1, height: 24, justifyContent: 'center', left: 131, overflow: 'hidden', position: 'absolute', top: 44, width: 24 },
  ballDimpleOne: { backgroundColor: 'rgba(29,74,53,0.12)', borderRadius: 99, height: 4, left: 6, position: 'absolute', top: 6, width: 4 },
  ballDimpleTwo: { backgroundColor: 'rgba(29,74,53,0.12)', borderRadius: 99, height: 4, right: 5, top: 9, width: 4 },
  ballDimpleThree: { backgroundColor: 'rgba(29,74,53,0.12)', borderRadius: 99, bottom: 5, height: 4, left: 9, position: 'absolute', width: 4 }
})
