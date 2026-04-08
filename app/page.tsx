'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowRight,
  Calendar,
  Droplets,
  LogIn,
  MapPin,
  MessageSquare,
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

interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
}

const featureCards = [
  {
    title: 'Post Open Tee Times',
    description:
      'Fill an empty slot fast and turn a canceled round into a new playing partner.',
    icon: Calendar,
  },
  {
    title: 'Build Real Groups',
    description:
      'Create city clubs, course crews, alumni circles, and tournament pods that actually stay active.',
    icon: Users,
  },
  {
    title: 'Run Better Events',
    description:
      'Organize money games, member events, and scrambles with one shared home base.',
    icon: Trophy,
  },
  {
    title: 'Keep The Conversation Going',
    description:
      'Message boards and group chat keep the round alive long after the 18th hole.',
    icon: MessageSquare,
  },
]

const highlights = [
  'Course-based communities',
  'Private and public groups',
  'Modern profile and messaging tools',
  'Tournament-ready social structure',
]

const founderPreview = {
  name: 'Luke Restall',
  title: 'Founder & CEO',
  image: '/luke-about.jpg',
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
    <div className="min-h-screen overflow-x-hidden bg-[#07140f] text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07140f]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" className="scale-100 origin-left lg:scale-[1.55]" />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="text-sm text-white/80">
                  {profile?.first_name || user.email?.split('@')[0] || 'Golfer'}
                </div>
              </div>

              <Link
                href="/dashboard"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-100"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
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
                className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105"
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
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/homepagevideo.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,15,0.28)_0%,rgba(7,20,15,0.72)_45%,rgba(7,20,15,0.96)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.22),transparent_24%)]" />
          </div>

          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-16 pt-32 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:items-end">
              <div className="max-w-4xl">
                <div className="mb-6 inline-flex items-center rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100 sm:text-sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  The network for golfers who actually want to connect
                </div>

                <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-8xl">
                  Meet your next
                  <span className="block bg-gradient-to-r from-emerald-200 via-cyan-200 to-sky-200 bg-clip-text text-transparent">
                    foursome before
                  </span>
                  the first tee.
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
                  Ultimate Golf Community helps golfers find tee times, create local groups,
                  organize events, and build a social golf scene with more energy than a static tee
                  sheet ever could.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-100"
                  >
                    Join Community
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    Meet the team
                  </Link>
                </div>

                <div className="mt-12 grid gap-4 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-4">
                  {highlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-md"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(5,14,11,0.92),rgba(13,33,26,0.92))] p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">
                        Community Snapshot
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">
                        Built for the modern golf scene
                      </h2>
                    </div>
                    <div className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                      Live
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Groups</p>
                      <p className="mt-3 text-3xl font-semibold text-white">500+</p>
                      <p className="mt-1 text-sm text-white/55">active communities</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Events</p>
                      <p className="mt-3 text-3xl font-semibold text-white">100+</p>
                      <p className="mt-1 text-sm text-white/55">tournaments and games</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-emerald-300" />
                      <div>
                        <p className="text-sm font-medium text-white">Where local golf gets social</p>
                        <p className="text-sm text-white/55">
                          Find your city, your course, or your kind of golfer.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/8 bg-black/15 p-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white">
                      <Image
                        src={founderPreview.image}
                        alt={founderPreview.name}
                        fill
                        className="object-cover object-[72%_center]"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{founderPreview.name}</p>
                      <p className="text-sm text-emerald-200/70">{founderPreview.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[1.8rem] border border-white/8 bg-[#0d211a]/85 p-6 shadow-xl shadow-black/20 backdrop-blur-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/20 to-cyan-300/20 text-emerald-100">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/65">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
                Why it works
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                We designed the platform around what actually happens in golf communities.
              </h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="rounded-[1.8rem] border border-white/8 bg-[#0b1b15] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/45">Before the round</p>
                  <p className="mt-4 text-lg font-medium text-white">
                    Find a game, fill a slot, and coordinate with people who are nearby and ready to play.
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-white/8 bg-[#0b1b15] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/45">During the season</p>
                  <p className="mt-4 text-lg font-medium text-white">
                    Keep your group active with recurring events, local leaderboards, and ongoing conversation.
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-white/8 bg-[#0b1b15] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/45">For organizers</p>
                  <p className="mt-4 text-lg font-medium text-white">
                    Create a recognizable home for your club, outing, scramble, or weekly money game.
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-white/8 bg-[#0b1b15] p-6">
                  <p className="text-sm uppercase tracking-[0.18em] text-white/45">For members</p>
                  <p className="mt-4 text-lg font-medium text-white">
                    Stay looped in with the people, places, and rounds that matter most to your golf life.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,#d8f6dd,#b8ebf5)] p-[1px]">
              <div className="rounded-[calc(2rem-1px)] bg-[#07140f] p-6">
                <div className="rounded-[1.7rem] bg-[linear-gradient(160deg,rgba(17,42,34,0.98),rgba(6,18,14,0.98))] p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                    Conditions snapshot
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Plan the round with confidence</h3>

                  {weatherLoading ? (
                    <div className="mt-8 flex h-44 items-center justify-center rounded-[1.4rem] border border-white/8 bg-white/5">
                      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-200" />
                    </div>
                  ) : weather ? (
                    <div className="mt-8 rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-white/55">{weather.location}</p>
                          <p className="mt-2 text-5xl font-semibold text-white">
                            {weather.temperature}°
                          </p>
                          <p className="mt-2 capitalize text-emerald-200">{weather.description}</p>
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
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#081711,#0d211a)] py-24">
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
                    <h3 className="mt-4 text-3xl font-semibold text-white">{founderPreview.name}</h3>
                    <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/45">
                      {founderPreview.title}
                    </p>
                    <p className="mt-5 max-w-xl text-base leading-8 text-white/68">
                      Ultimate Golf Community is rooted in Luke&apos;s belief that the best rounds often
                      start with unfamiliar people and end with real connection. The brand is being built
                      to make that kind of experience easier to find again and again.
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
                  Behind the brand
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                  Built by people who believe golf gets better when it gets more connected.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                  Ultimate Golf Community started from a simple truth: some of the best rounds in life
                  begin with people who were strangers an hour earlier. We are building the place where
                  those introductions happen more often, with more ease, and with more energy.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-100"
                  >
                    Explore About Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  {!user && (
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/8"
                    >
                      Start your profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/8 bg-[linear-gradient(135deg,#d7fae3_0%,#dff5ff_52%,#faf2da_100%)] p-[1px] shadow-2xl shadow-black/20">
            <div className="rounded-[calc(2.5rem-1px)] bg-[#091711] px-6 py-16 sm:px-10 lg:px-16">
              <div className="mx-auto max-w-4xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                  Ready to tee it up?
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
                  Start the kind of golf community people want to come back to.
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
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/about" className="transition hover:text-white">
                About Us
              </Link>
              <a href="/privacy" className="transition hover:text-white">
                Privacy Policy
              </a>
              <a href="mailto:support@ultimategolfcommunity.com" className="transition hover:text-white">
                Support
              </a>
            </div>
            <p>© 2026 Ultimate Golf Community. All rights reserved.</p>
          </div>
        </footer>
      </main>

      <PWAInstallPrompt />
    </div>
  )
}
