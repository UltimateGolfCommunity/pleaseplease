'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowRight,
  Calendar,
  Camera,
  Compass,
  Droplets,
  LogIn,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  User,
  UserPlus,
  Users,
  Wind,
} from 'lucide-react'
import Logo from '@/app/components/Logo'
import PWAInstallPrompt from '@/app/components/PWAInstallPrompt'

const displayFont = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'] })
const bodyFont = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] })

interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
}

const featureLanes = [
  {
    title: 'Find the round fast',
    description: 'Post open tee times, fill spots, and get golfers moving without a text-chain mess.',
    icon: Calendar,
    accent: 'from-emerald-300/30 to-cyan-300/10',
  },
  {
    title: 'Turn groups into real communities',
    description: 'Build city crews, private clubs, course communities, and event circles that stay active.',
    icon: Users,
    accent: 'from-cyan-300/25 to-sky-300/10',
  },
  {
    title: 'Make every post feel alive',
    description: 'Photos, scores, comments, likes, and updates all live in one modern golf feed.',
    icon: Camera,
    accent: 'from-amber-300/20 to-emerald-300/10',
  },
]

const proofPoints = [
  'Post public or private tee times',
  'Create group boards and course communities',
  'Track scores, bag updates, and milestones',
  'Connect with golfers nearby in one clean network',
]

const socialMoments = [
  {
    label: 'Today',
    title: 'A network that moves like a real clubhouse',
    body: 'Rounds, connections, group posts, photos, and scorecards all stack into one social layer instead of getting buried across different tools.',
  },
  {
    label: 'Groups',
    title: 'Private groups, public scenes, and course-specific communities',
    body: 'Whether it is your weekly game, a city-wide golf scene, or a specific course crowd, the product gives each one a place to feel active.',
  },
  {
    label: 'Profiles',
    title: 'A golfer identity with actual depth',
    body: 'Show your bag, your scores, your photos, your connections, and the details that make your golf life feel personal.',
  },
]

const founderPreview = {
  name: 'Luke Restall',
  title: 'Founder & CEO',
  image: '/luke-about.jpg',
}

const liveActivity = [
  {
    name: 'Dylan',
    action: 'posted a tee time at McCabe',
    meta: '3 spots left • 9:47 AM',
    tone: 'emerald',
  },
  {
    name: 'Grant',
    action: 'shared an 81 at NGAC',
    meta: 'Avg 4.50 / hole',
    tone: 'cyan',
  },
  {
    name: 'Ashton',
    action: 'joined Men of McCabe',
    meta: 'New local group activity',
    tone: 'amber',
  },
]

function formatWeatherMessage(weather: WeatherData) {
  const description = weather.description.toLowerCase()

  if (description.includes('storm') || description.includes('thunder')) {
    return 'Might be a range day'
  }

  if (weather.windSpeed >= 18) {
    return 'Playable, but breezy'
  }

  if (weather.temperature >= 88) {
    return 'Warm one, hydrate early'
  }

  if (weather.temperature <= 48) {
    return 'Cool start, good layering weather'
  }

  return 'Prime weather for a walk'
}

export default function HomePage() {
  const { user, profile, signOut } = useAuth()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true)
        const response = await fetch('/api/weather?city=San Francisco')

        if (!response.ok) {
          throw new Error('Weather request failed')
        }

        const weatherData = await response.json()
        setWeather(weatherData)
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      } finally {
        setWeatherLoading(false)
      }
    }

    fetchWeather()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Failed to sign out. Please try again.')
    }
  }

  return (
    <div className={`min-h-screen overflow-x-hidden bg-[#06110d] text-white ${bodyFont.className}`}>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06110d]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" className="origin-left scale-[1.2] sm:scale-[1.4]" />
          </Link>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-cyan-300">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-[#06110d]" />
                  )}
                </div>
                <div className="text-sm font-medium text-white/80">
                  {profile?.first_name || user.email?.split('@')[0] || 'Golfer'}
                </div>
              </div>

              <Link
                href="/dashboard"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-100"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/about"
                className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/75 transition hover:border-white/20 hover:text-white sm:inline-flex"
              >
                About
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/5"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join Now
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            <video autoPlay loop muted playsInline className="h-full w-full object-cover">
              <source src="/homepagevideo.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,13,0.22)_0%,rgba(6,17,13,0.75)_48%,rgba(6,17,13,0.98)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(52,211,153,0.18),transparent_30%),radial-gradient(circle_at_78%_14%,rgba(34,211,238,0.16),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(250,204,21,0.08),transparent_24%)]" />
          </div>

          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_430px] lg:items-end">
              <div className="max-w-4xl">
                <div className="mb-6 inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100 sm:text-sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Social golf, finally designed with taste
                </div>

                <h1
                  className={`max-w-5xl text-5xl font-medium leading-[0.9] tracking-[-0.05em] text-white sm:text-6xl lg:text-[6.4rem] ${displayFont.className}`}
                >
                  The digital clubhouse
                  <span className="mt-2 block bg-gradient-to-r from-emerald-100 via-cyan-100 to-sky-200 bg-clip-text text-transparent">
                    for golfers who actually play.
                  </span>
                </h1>

                <p className="mt-7 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">
                  Ultimate Golf Community brings tee times, groups, score tracking, photo sharing,
                  local discovery, and golfer profiles into one clean, social experience that feels
                  built for real golf life instead of generic scheduling software.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href={user ? '/dashboard' : '/auth/signup'}
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-100"
                  >
                    {user ? 'Open Dashboard' : 'Join Community'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    See the vision
                  </Link>
                </div>

                <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {proofPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.6rem] border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-white/72 backdrop-blur-md"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-black/30 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,19,15,0.96),rgba(14,34,27,0.94))] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                        Live around the course
                      </p>
                      <h2 className={`mt-2 text-2xl font-medium text-white ${displayFont.className}`}>
                        One feed for the golf life
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
                      Active
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {liveActivity.map((item) => (
                      <div
                        key={item.name + item.action}
                        className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${
                                item.tone === 'emerald'
                                  ? 'from-emerald-300/25 to-emerald-500/10'
                                  : item.tone === 'cyan'
                                    ? 'from-cyan-300/25 to-sky-500/10'
                                    : 'from-amber-300/25 to-amber-500/10'
                              }`}
                            >
                              <span className="text-sm font-bold text-white">{item.name.slice(0, 1)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{item.name}</p>
                              <p className="text-sm text-white/62">{item.action}</p>
                            </div>
                          </div>
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                        </div>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/42">{item.meta}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-center">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">Groups</p>
                      <p className="mt-2 text-2xl font-semibold text-white">500+</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-center">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">Rounds</p>
                      <p className="mt-2 text-2xl font-semibold text-white">Daily</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-center">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">Scene</p>
                      <p className="mt-2 text-2xl font-semibold text-white">Local</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
            {featureLanes.map(({ title, description, icon: Icon, accent }) => (
              <div
                key={title}
                className="rounded-[2rem] border border-white/8 bg-[#0b1b15]/90 p-7 shadow-xl shadow-black/20 backdrop-blur-xl"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br ${accent} text-emerald-100`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className={`mt-7 text-2xl font-medium text-white ${displayFont.className}`}>{title}</h3>
                <p className="mt-4 text-base leading-7 text-white/64">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_0.95fr]">
            <div className="rounded-[2.3rem] border border-white/8 bg-[linear-gradient(180deg,#0b1b15,#0e261d)] p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
                Built around real golf behavior
              </p>
              <h2 className={`mt-4 max-w-3xl text-4xl font-medium tracking-[-0.04em] text-white sm:text-5xl ${displayFont.className}`}>
                Not a booking tool pretending to be a community.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
                We designed the product around how golfers actually move: finding a game, sharing
                scores, checking conditions, posting a photo from the round, building a group, and
                keeping a local golf network warm between rounds.
              </p>

              <div className="mt-10 space-y-4">
                {socialMoments.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.7rem] border border-white/8 bg-white/5 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/75">
                      {item.label}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-base leading-7 text-white/62">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2.2rem] border border-white/8 bg-[linear-gradient(135deg,#d7fae3_0%,#dff5ff_58%,#f7f0cf_100%)] p-[1px] shadow-2xl shadow-black/20">
                <div className="rounded-[calc(2.2rem-1px)] bg-[#07140f] p-6">
                  <div className="rounded-[1.8rem] bg-[linear-gradient(165deg,rgba(18,44,35,0.98),rgba(8,21,16,0.98))] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                          Conditions snapshot
                        </p>
                        <h3 className={`mt-3 text-2xl font-medium text-white ${displayFont.className}`}>
                          Play smarter before you leave the house
                        </h3>
                      </div>
                      <Compass className="mt-1 h-5 w-5 text-cyan-200" />
                    </div>

                    {weatherLoading ? (
                      <div className="mt-8 flex h-44 items-center justify-center rounded-[1.4rem] border border-white/8 bg-white/5">
                        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-200" />
                      </div>
                    ) : weather ? (
                      <div className="mt-8 rounded-[1.6rem] border border-white/8 bg-white/5 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-white/55">{weather.location}</p>
                            <p className={`mt-2 text-5xl font-medium text-white ${displayFont.className}`}>
                              {weather.temperature}°
                            </p>
                            <p className="mt-2 capitalize text-emerald-200">{weather.description}</p>
                            <p className="mt-3 text-sm text-white/55">{formatWeatherMessage(weather)}</p>
                          </div>
                          <img
                            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                            alt={weather.description}
                            className="h-20 w-20"
                          />
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-white/8 bg-black/15 p-3 text-center">
                            <Droplets className="mx-auto h-4 w-4 text-cyan-200" />
                            <p className="mt-2 text-sm text-white">{weather.humidity}%</p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-black/15 p-3 text-center">
                            <Wind className="mx-auto h-4 w-4 text-sky-200" />
                            <p className="mt-2 text-sm text-white">{weather.windSpeed} mph</p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-black/15 p-3 text-center">
                            <Sun className="mx-auto h-4 w-4 text-amber-200" />
                            <p className="mt-2 text-sm text-white">{weather.feelsLike}°</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 rounded-[1.4rem] border border-white/8 bg-white/5 p-6 text-white/60">
                        Weather information is unavailable right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/8 bg-[#0a1a14] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">What the product unlocks</p>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-300/10 p-3 text-emerald-100">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Conversation that stays attached to the round</p>
                        <p className="mt-1 text-sm text-white/58">Groups, comments, likes, and photos live where the golf actually happened.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-100">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Scores that become social proof</p>
                        <p className="mt-1 text-sm text-white/58">Logged rounds, averages, and milestones feed back into each golfer’s identity.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-300/10 p-3 text-amber-100">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">A cleaner experience for organizers</p>
                        <p className="mt-1 text-sm text-white/58">Run private groups, invite members, and keep the whole thing feeling intentional.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#07140f,#0c2018)] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_minmax(0,1.05fr)] lg:items-center">
              <div className="rounded-[2.2rem] border border-white/8 bg-white/5 p-6 backdrop-blur-sm">
                <div className="grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/90">
                    <Image
                      src={founderPreview.image}
                      alt={founderPreview.name}
                      fill
                      className="object-cover object-[72%_center]"
                      sizes="220px"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200/75">
                      About the brand
                    </p>
                    <h3 className={`mt-4 text-3xl font-medium text-white ${displayFont.className}`}>
                      {founderPreview.name}
                    </h3>
                    <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/45">
                      {founderPreview.title}
                    </p>
                    <p className="mt-5 max-w-xl text-base leading-8 text-white/68">
                      Ultimate Golf Community started from a simple belief: the best rounds often
                      begin with people who were strangers an hour earlier. The brand is being built
                      to help those introductions happen more often and with much better tools.
                    </p>
                    <Link
                      href="/about"
                      className="mt-6 inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/8"
                    >
                      Read Luke&apos;s story
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                  The point of the platform
                </p>
                <h2 className={`mt-4 text-4xl font-medium tracking-[-0.04em] text-white sm:text-5xl ${displayFont.className}`}>
                  Build a golf scene people actually want to be part of.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                  This is not about posting static tee times into the void. It is about helping
                  golfers build momentum around where they play, who they know, and what kind of
                  community they want to keep returning to.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-100"
                  >
                    Explore About Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  {!user ? (
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/8"
                    >
                      Start your profile
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.6rem] border border-white/8 bg-[linear-gradient(135deg,#d7fae3_0%,#dff5ff_52%,#faf2da_100%)] p-[1px] shadow-2xl shadow-black/20">
            <div className="rounded-[calc(2.6rem-1px)] bg-[#07140f] px-6 py-16 sm:px-10 lg:px-16">
              <div className="mx-auto max-w-4xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                  Ready to tee it up?
                </p>
                <h2 className={`mt-4 text-4xl font-medium tracking-[-0.04em] text-white sm:text-6xl ${displayFont.className}`}>
                  Start the kind of golf community people come back to.
                </h2>
                <p className="mt-6 text-lg leading-8 text-white/70 sm:text-xl">
                  Create your space, invite your players, and make every open spot feel like an opportunity.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href={user ? '/dashboard' : '/auth/signup'}
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-100"
                  >
                    {user ? 'Go to Dashboard' : 'Join Community'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <a
                    href="mailto:support@ultimategolfcommunity.com"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/8"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/8 bg-[#060f0c]">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-white/55 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="font-medium text-white/75">Ultimate Golf Community</p>
              <p className="mt-1">The social home for golfers, groups, and real tee-time energy.</p>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/about" className="transition hover:text-white">
                About
              </Link>
              <Link href="/privacy" className="transition hover:text-white">
                Privacy
              </Link>
              <Link href="/auth/signup" className="transition hover:text-white">
                Join
              </Link>
            </div>
          </div>
        </footer>
      </main>

      <PWAInstallPrompt />
    </div>
  )
}
