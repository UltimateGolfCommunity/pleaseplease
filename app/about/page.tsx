'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, MapPin, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/app/components/Logo'
import ThemeToggle from '@/app/components/ThemeToggle'

const values = [
  {
    icon: MapPin,
    title: 'Local Momentum',
    description:
      'Strong golf communities start locally, with familiar courses, recurring groups, and people who actually see each other again.',
  },
  {
    icon: Users,
    title: 'Belonging',
    description:
      'We want the first tee to feel less intimidating, more welcoming, and easier to return to with the right people around you.',
  },
  {
    icon: Heart,
    title: 'Long-Term Relationships',
    description:
      'The goal is not just to book a round. It is to build the kinds of relationships that keep golfers coming back every season.',
  },
]

export default function AboutPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#07140f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07140f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={user ? '/dashboard' : '/'}>
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={user ? '/dashboard' : '/'}
              className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {user ? 'Back to Dashboard' : 'Back to Home'}
            </Link>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_26%),radial-gradient(circle_at_85%_0%,rgba(125,211,252,0.18),transparent_24%)]" />
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
                  About Ultimate Golf Community
                </p>
                <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                  We are building a home for the social side of golf.
                </h1>
                <p className="mt-8 max-w-3xl text-lg leading-8 text-white/70 sm:text-xl">
                  Ultimate Golf Community exists to make it easier for golfers to find their people,
                  create repeat experiences, and turn one good round into a lasting network.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/8 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                  Built around
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white">
                    <Image
                      src="/luke-about.jpg"
                      alt="Luke Restall"
                      fill
                      className="object-cover object-[72%_center]"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Luke Restall</p>
                    <p className="text-sm text-emerald-200/70">Founder & CEO</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  A founder-led brand shaped by real rounds, real introductions, and the belief that golf
                  should make connection easier.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[2.3rem] border border-white/8 bg-[linear-gradient(160deg,rgba(14,35,29,0.95),rgba(8,20,15,0.98))] p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                <div className="relative mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/90 shadow-2xl shadow-black/20">
                  <Image
                    src="/luke-about.jpg"
                    alt="Luke Restall"
                    fill
                    className="object-cover object-[72%_center]"
                    sizes="320px"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                    Founder
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                    Luke Restall is building the kind of golf platform he always wished existed.
                  </h2>
                  <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                    Founder-led, relationship-first, built for recurring community
                  </div>
                  <div className="mt-6 space-y-4 text-base leading-8 text-white/72">
                    <p>
                      Luke started with the same experience many golfers know well: showing up,
                      getting paired with strangers, and discovering that some of the most memorable
                      rounds happen with people you did not know an hour earlier.
                    </p>
                    <p>
                      Over time, those pairings became real friendships, business opportunities,
                      recurring games, and trusted relationships. That pattern felt too valuable to
                      leave to chance.
                    </p>
                    <p>
                      Ultimate Golf Community was created to give that experience a platform, making
                      it easier for golfers to meet, return, organize, and build community with
                      intention.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                Our mission
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                Make every round easier to start and every good connection easier to keep.
              </h2>
              <p className="mt-6 text-base leading-8 text-white/72">
                We are building the digital infrastructure for golf communities that want more than a
                tee sheet. The goal is to help people organize groups, share opportunities, and keep a
                real sense of momentum around the game they love.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-white/8 bg-black/15 p-4 text-white/70">
                  Course-based groups with an actual identity
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/15 p-4 text-white/70">
                  Better discovery for players, organizers, and recurring events
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/15 p-4 text-white/70">
                  A social layer that keeps golfers engaged between rounds
                </div>
              </div>
            </div>

              <div className="rounded-[2.2rem] border border-white/8 bg-[#081711] p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                  What the brand stands for
                </p>
                <div className="mt-5 space-y-4 text-base leading-8 text-white/68">
                  <p>
                    The brand is not about making golf louder. It is about making golf more connected,
                    more welcoming, and easier to return to with the right people around you.
                  </p>
                  <p>
                    Every design choice and product decision is meant to support repeat rounds, stronger
                    groups, and the kind of momentum that turns casual players into community members.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="rounded-[2.4rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 sm:p-10 lg:p-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
                Core values
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                The standards we want golfers to feel when they use the platform.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {values.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[1.8rem] border border-white/8 bg-[#081711] p-6"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/6">
                    <Icon className="h-6 w-6 text-emerald-200" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-white">{title}</h3>
                  <p className="mt-4 text-base leading-8 text-white/68">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2.5rem] border border-white/8 bg-[linear-gradient(135deg,#d7fae3_0%,#ddf5ff_45%,#fff1d1_100%)] p-[1px]">
              <div className="rounded-[calc(2.5rem-1px)] bg-[#091711] px-6 py-14 sm:px-10">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                    We are building for golfers who want the round to mean more.
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-white/70">
                    If that sounds like your kind of community, come join us and help shape what this
                    becomes.
                  </p>
                  <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      href={user ? '/dashboard' : '/auth/signup'}
                      className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-100"
                    >
                      {user ? 'Go to Dashboard' : 'Join Our Community'}
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/8"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
