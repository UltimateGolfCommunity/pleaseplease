import { useState } from 'react'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function CourseScreen() {
  const { loading, user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    location: '',
    description: '',
    course_type: 'public',
    holes: '18',
    par: '72'
  })

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSave = async () => {
    if (!user?.id) return

    if (!form.name.trim() || !form.location.trim()) {
      Alert.alert('Missing info', 'Course name and location are required.')
      return
    }

    setSaving(true)
    try {
      await apiPost('/api/golf-courses/manage', {
        action: 'create',
        name: form.name.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        course_type: form.course_type,
        holes: Number(form.holes) || 18,
        par: Number(form.par) || 72,
        created_by: user.id
      })

      Alert.alert('Course added', 'This course is now in the system.')
      setForm({
        name: '',
        location: '',
        description: '',
        course_type: 'public',
        holes: '18',
        par: '72'
      })
    } catch (error) {
      Alert.alert('Unable to add course', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandHeader title="Course" showBack />

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Add a course</Text>
          <Text style={styles.title}>Put a new spot on the map</Text>
          <Text style={styles.body}>
            Add the course details here so golfers can discover it and start posting rounds around it.
          </Text>

          <TextInput
            onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="Course name"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={form.name}
          />
          <TextInput
            onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
            placeholder="Location"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={form.location}
          />
          <TextInput
            onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
            placeholder="Description"
            placeholderTextColor={palette.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
            value={form.description}
          />
          <View style={styles.row}>
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, holes: value }))}
              placeholder="Holes"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              style={[styles.input, styles.flexInput]}
              value={form.holes}
            />
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, par: value }))}
              placeholder="Par"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              style={[styles.input, styles.flexInput]}
              value={form.par}
            />
          </View>
          <View style={styles.segmentRow}>
            {[
              { label: 'Public', value: 'public' },
              { label: 'Private', value: 'private' },
              { label: 'Resort', value: 'resort' }
            ].map((option) => {
              const active = form.course_type === option.value
              return (
                <Text
                  key={option.value}
                  onPress={() => setForm((current) => ({ ...current, course_type: option.value }))}
                  style={[styles.segment, active && styles.segmentActive, active && styles.segmentTextActive]}
                >
                  {option.label}
                </Text>
              )
            })}
          </View>

          <PrimaryButton label="Save Course" loading={saving} onPress={handleSave} />
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
    gap: 18,
    padding: 20
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  eyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  body: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 52,
    paddingHorizontal: 16
  },
  textarea: {
    minHeight: 110,
    paddingTop: 14,
    textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  flexInput: {
    flex: 1
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10
  },
  segment: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.textMuted,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: 'center'
  },
  segmentActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  segmentTextActive: {
    color: palette.aqua,
    fontWeight: '700'
  }
})
