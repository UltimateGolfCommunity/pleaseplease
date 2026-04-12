import fs from 'node:fs'
import path from 'node:path'

const root = '/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app'

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
}

function readEnv(relativePath) {
  const fullPath = path.join(root, relativePath)

  if (!fs.existsSync(fullPath)) {
    return {}
  }

  return Object.fromEntries(
    fs
      .readFileSync(fullPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1)]
      })
  )
}

const appJson = readJson('app.json')
const easJson = readJson('eas.json')
const env = readEnv('.env')

const requiredEnv = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SITE_URL',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
]

const recommendedEnv = [
  'EXPO_PUBLIC_SUPPORT_EMAIL',
  'EXPO_PUBLIC_PRIVACY_URL'
]

const checks = [
  {
    label: 'App version is set',
    ok: Boolean(appJson?.expo?.version)
  },
  {
    label: 'iOS bundle identifier is set',
    ok: Boolean(appJson?.expo?.ios?.bundleIdentifier)
  },
  {
    label: 'iOS app version source is configured',
    ok: easJson?.cli?.appVersionSource === 'remote' || Boolean(appJson?.expo?.ios?.buildNumber)
  },
  {
    label: 'Apple Sign In is enabled in app config',
    ok: Boolean(appJson?.expo?.ios?.usesAppleSignIn)
  },
  {
    label: 'EAS production profile exists',
    ok: Boolean(easJson?.build?.production)
  },
  {
    label: 'App Store Connect app id is configured',
    ok:
      Boolean(easJson?.submit?.production?.ios?.ascAppId) &&
      easJson.submit.production.ios.ascAppId !== 'SET_IN_EAS_WHEN_APP_STORE_CONNECT_APP_EXISTS'
  },
  ...requiredEnv.map((key) => ({
    label: `${key} is set`,
    ok: Boolean(env[key])
  })),
  ...recommendedEnv.map((key) => ({
    label: `${key} is set (recommended)`,
    ok: Boolean(env[key])
  }))
]

const failed = checks.filter((check) => !check.ok)

console.log('\nUltimate Golf Community mobile release preflight\n')
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.label}`)
}

if (failed.length) {
  console.log('\nMissing items:')
  for (const check of failed) {
    console.log(`- ${check.label}`)
  }
  process.exitCode = 1
} else {
  console.log('\nAll preflight checks passed.')
}
