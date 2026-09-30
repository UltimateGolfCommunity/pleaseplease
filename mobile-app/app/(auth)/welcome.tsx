import Ionicons from '@expo/vector-icons/Ionicons'
import { Redirect, router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryButton } from '@/components/PrimaryButton'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function WelcomeScreen() {
  const { loading, user } = useAuth()

  if (!loading && user) return <Redirect href="/home" />

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.skyGlow} />
      <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>UGC</Text></View>
          <Text style={styles.brandName}>Ultimate Golf Community</Text>
        </View>

        <View style={styles.clubhouseScene}>
          <View style={styles.sun} />
          <View style={styles.cloudOne} />
          <View style={styles.cloudTwo} />
          <View style={styles.clubhouseRoof} />
          <View style={styles.cupola}><View style={styles.cupolaWindow} /></View>
          <View style={styles.clubhouseFacade}>
            <View style={styles.window} />
            <View style={styles.window} />
            <View style={styles.door} />
            <View style={styles.window} />
            <View style={styles.window} />
          </View>
          <View style={styles.green} />
          <View style={styles.flagPole} />
          <View style={styles.flag} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>YOUR PRIVATE GOLF CLUB</Text>
          <Text style={styles.title}>Your golf life,{`\n`}beautifully connected.</Text>
          <Text style={styles.body}>Find your people, build your local club, and make every round feel like it belongs to something bigger.</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Create your account" onPress={() => router.push('/signup')} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.signInButton}>
            <Text style={styles.signInText}>I already have an account</Text>
            <Ionicons color={palette.cream} name="arrow-forward" size={17} />
          </Pressable>
        </View>

        <View style={styles.footer}><Ionicons color="#bf9e55" name="golf-outline" size={15} /><Text style={styles.footerText}>The modern golf community</Text></View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#bcdde8', flex: 1 },
  skyGlow: { backgroundColor: 'rgba(255,249,223,0.56)', borderRadius: 999, height: 330, left: -110, position: 'absolute', top: 130, width: 390 },
  content: { flexGrow: 1, padding: 22, paddingBottom: 28 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 36 },
  brandMark: { alignItems: 'center', backgroundColor: '#174634', borderColor: 'rgba(255,252,239,0.65)', borderRadius: 11, borderWidth: 1, height: 31, justifyContent: 'center', width: 42 },
  brandMarkText: { color: '#f2d78e', fontFamily: 'Georgia', fontSize: 14, fontWeight: '700', letterSpacing: -0.5 },
  brandName: { color: '#174634', fontFamily: 'Georgia', fontSize: 16, fontWeight: '700' },
  clubhouseScene: { height: 252, marginHorizontal: -22, marginTop: 20, overflow: 'hidden', position: 'relative' },
  sun: { backgroundColor: '#f4cf70', borderRadius: 999, height: 54, position: 'absolute', right: 51, top: 14, width: 54 },
  cloudOne: { backgroundColor: 'rgba(255,255,255,0.38)', borderRadius: 99, height: 35, left: 38, position: 'absolute', top: 30, width: 104 },
  cloudTwo: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 99, height: 22, left: 147, position: 'absolute', top: 69, width: 75 },
  clubhouseRoof: { alignSelf: 'center', borderBottomColor: '#2d4541', borderBottomWidth: 86, borderLeftColor: 'transparent', borderLeftWidth: 190, borderRightColor: 'transparent', borderRightWidth: 190, height: 0, position: 'absolute', top: 50, width: 0 },
  cupola: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#fff9eb', borderColor: '#263d39', borderRadius: 14, borderTopWidth: 9, height: 48, position: 'absolute', top: 26, width: 35 },
  cupolaWindow: { backgroundColor: '#315d55', borderTopLeftRadius: 7, borderTopRightRadius: 7, height: 22, marginTop: 6, width: 13 },
  clubhouseFacade: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#f7f2e4', borderColor: '#d5caa9', borderTopWidth: 2, borderWidth: 1, bottom: 36, flexDirection: 'row', height: 75, justifyContent: 'space-evenly', position: 'absolute', width: '92%' },
  window: { backgroundColor: '#315d55', borderColor: '#fffdf5', borderRadius: 7, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderWidth: 3, height: 31, width: 29 },
  door: { alignSelf: 'flex-end', backgroundColor: '#755635', borderColor: '#e2d5b4', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, height: 49, width: 38 },
  green: { backgroundColor: '#638b50', borderColor: '#91ae70', borderTopWidth: 5, borderRadius: 999, bottom: -78, height: 142, left: -55, position: 'absolute', width: '130%' },
  flagPole: { backgroundColor: '#fffaf0', bottom: 25, height: 58, position: 'absolute', right: 90, width: 2 },
  flag: { backgroundColor: '#e7c66e', borderBottomRightRadius: 5, borderTopRightRadius: 5, height: 17, position: 'absolute', right: 69, top: 173, width: 22 },
  copy: { alignItems: 'center', marginTop: 4, paddingHorizontal: 10 },
  eyebrow: { color: '#996d2c', fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 10 },
  title: { color: '#153e2e', fontFamily: 'Georgia', fontSize: 34, fontWeight: '700', letterSpacing: -0.7, lineHeight: 37, textAlign: 'center' },
  body: { color: '#375f55', fontSize: 16, lineHeight: 23, marginTop: 14, maxWidth: 340, textAlign: 'center' },
  actions: { gap: 10, marginTop: 28 },
  signInButton: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48 },
  signInText: { color: '#174634', fontSize: 15, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 'auto', paddingTop: 20 },
  footerText: { color: '#51746b', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }
})
