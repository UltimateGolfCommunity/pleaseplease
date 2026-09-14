'use client'

import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { ArrowRight, Check, ChevronDown, CirclePlay, Medal, Trophy, Users } from 'lucide-react'
import Logo from '@/app/components/Logo'
import { useAuth } from '@/contexts/AuthContext'

const displayFont = Playfair_Display({ subsets: ['latin'], weight: ['500', '600', '700'] })
const bodyFont = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const appStoreUrl = 'https://apps.apple.com/app/id6762129049'

const screens = [
  { src: '/app-screens/home.png', alt: 'Ultimate Golf Community home feed', title: 'Your private golf club', description: 'The people, rounds, and moments around your game—always in one place.' },
  { src: '/app-screens/profile.png', alt: 'Ultimate Golf Community golfer profile', title: 'A profile built for golf', description: 'Show your game, build your network, and keep your golf identity all your own.' },
  { src: '/app-screens/tournament.png', alt: 'Ultimate Golf Community tournament scoreboard', title: 'Tournaments made social', description: 'Create teams, track matchups, and keep everyone following the competition live.' },
  { src: '/app-screens/member-card.png', alt: 'Ultimate Golf Community member QR card', title: 'Share your golf identity', description: 'Your member card is ready to scan, share, and take to the next tee box.' },
]

function AppStoreButton({ compact = false }: { compact?: boolean }) {
  return (
    <a href={appStoreUrl} target="_blank" rel="noreferrer" aria-label="Download Ultimate Golf Community on the App Store" className={`group inline-flex items-center justify-center rounded-xl border border-white/25 bg-[linear-gradient(145deg,#202020,#050505)] text-white shadow-[0_12px_24px_rgba(4,24,16,0.28)] transition hover:-translate-y-0.5 hover:border-white/50 hover:shadow-[0_16px_30px_rgba(4,24,16,0.34)] ${compact ? 'min-h-11 px-3.5 py-2' : 'min-h-16 px-5 py-3'}`}>
      <span className={`mr-3 font-sans font-light leading-none ${compact ? 'text-2xl' : 'text-[2.15rem]'}`}></span>
      <span className="text-left leading-none"><span className={`block font-medium tracking-[0.06em] text-white/80 ${compact ? 'text-[7px]' : 'text-[10px]'}`}>DOWNLOAD ON THE</span><span className={`mt-1 block font-semibold tracking-[-0.025em] ${compact ? 'text-sm' : 'text-[1.28rem]'}`}>App Store</span></span>
    </a>
  )
}

export default function HomePage() {
  const { user } = useAuth()

  return (
    <main className={`min-h-screen overflow-hidden bg-[#f5f1e8] text-[#0b2b1e] ${bodyFont.className}`}>
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_80%_10%,rgba(172,213,230,0.9),transparent_27rem),radial-gradient(circle_at_13%_3%,rgba(242,221,158,0.72),transparent_25rem),linear-gradient(180deg,#e8f5f6_0%,#f5f1e8_95%)]" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Ultimate Golf Community home"><Logo size="sm" /><span className={`hidden text-lg font-semibold tracking-[-0.035em] text-[#113d2b] sm:block ${displayFont.className}`}>Ultimate Golf Community</span></Link>
        <div className="flex items-center gap-3">
          <a href="#inside-the-app" className="hidden text-sm font-semibold text-[#123c2b]/70 transition hover:text-[#123c2b] sm:block">Inside the app</a>
          <Link href={user ? '/dashboard' : '/auth/login'} className="hidden rounded-full border border-[#123c2b]/15 px-4 py-2 text-sm font-semibold text-[#123c2b] transition hover:bg-white/60 sm:inline-flex">{user ? 'Open app' : 'Sign in'}</Link>
          <AppStoreButton compact />
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-7 sm:px-8 sm:pt-10 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-8 lg:px-8 lg:pb-28">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-[#0d5235]/15 bg-white/65 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#126045] shadow-sm backdrop-blur">The modern golf community</div>
          <h1 className={`mt-6 text-5xl leading-[0.96] tracking-[-0.055em] text-[#0c3021] sm:text-6xl lg:text-[5.45rem] ${displayFont.className}`}>Your golf life,<span className="block text-[#126045]">beautifully connected.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#335c4d] sm:text-xl">Bring the benefits of a private club to every course you play. Build your own local golf community, meet the right people, and make every round more social.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"><AppStoreButton /><a href="#inside-the-app" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#123c2b]/15 bg-white/55 px-5 py-4 font-semibold text-[#174432] transition hover:bg-white"><CirclePlay className="h-5 w-5 text-[#238066]" />Explore the experience</a></div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#315746]"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#258165]" />Free to join</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#258165]" />Built for iPhone</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#258165]" />Your community, your way</span></div>
        </div>

        <div className="relative mt-16 min-h-[36rem] sm:min-h-[43rem] lg:mt-0">
          <div className="absolute left-[4%] top-[10%] h-72 w-72 rounded-full bg-[#a7d3ba]/70 blur-3xl" /><div className="absolute bottom-[8%] right-[3%] h-64 w-64 rounded-full bg-[#e7ca7a]/45 blur-3xl" />
          <div className="absolute left-[7%] top-[11%] w-[45%] -rotate-[10deg] overflow-hidden rounded-[2.2rem] border-[7px] border-[#142b20] bg-[#142b20] shadow-2xl shadow-[#0b3021]/25 sm:left-[10%] sm:w-[39%]"><Image src="/app-screens/profile.png" alt="Golfer profile in the app" width={1170} height={2532} className="h-auto w-full" priority /></div>
          <div className="absolute right-[7%] top-[1%] w-[51%] rotate-[7deg] overflow-hidden rounded-[2.5rem] border-[8px] border-[#142b20] bg-[#142b20] shadow-2xl shadow-[#0b3021]/30 sm:right-[11%] sm:w-[44%]"><Image src="/app-screens/home.png" alt="Ultimate Golf Community home screen" width={1170} height={2532} className="h-auto w-full" priority /></div>
          <div className="absolute bottom-[2%] left-[32%] rounded-2xl border border-white/70 bg-[#fdfbf6]/90 px-4 py-3 shadow-xl backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#647969]">The clubhouse is open</p><p className={`mt-1 text-lg text-[#104431] ${displayFont.className}`}>Find your people.</p></div>
        </div>
      </section>

      <section id="inside-the-app" className="relative bg-[#0a3021] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#e8ca78]">Inside Ultimate Golf Community</p><h2 className={`mt-4 text-4xl leading-tight tracking-[-0.035em] sm:text-5xl ${displayFont.className}`}>Everything you need to make golf feel more connected.</h2></div>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {screens.map((screen, index) => (
              <article key={screen.title} className={`group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08] ${index === 0 ? 'md:col-span-2 md:grid md:grid-cols-[0.86fr_1.14fr] md:items-center md:gap-10' : ''}`}>
                <div className={`relative overflow-hidden rounded-[1.55rem] bg-[#0b2118] ${index === 0 ? 'mx-auto w-full max-w-[310px] md:order-2 md:max-w-[360px]' : 'mx-auto max-w-[295px]'}`}><Image src={screen.src} alt={screen.alt} width={1170} height={2532} className="h-auto w-full transition duration-500 group-hover:scale-[1.025]" /></div>
                <div className={index === 0 ? 'px-2 pb-2 pt-7 md:order-1 md:px-8' : 'px-2 pb-3 pt-7'}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e8ca78]">0{index + 1}</p><h3 className={`mt-3 text-3xl tracking-[-0.03em] ${displayFont.className}`}>{screen.title}</h3><p className="mt-3 max-w-md text-base leading-7 text-white/70">{screen.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e8f2ea] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-10">
          <div className="rounded-[2rem] bg-[#fffdf7] p-7 shadow-xl shadow-[#0a3021]/10 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#238066]">Create more than a group chat</p><h2 className={`mt-4 text-4xl leading-tight tracking-[-0.04em] text-[#0c3021] sm:text-5xl ${displayFont.className}`}>Build your own club, wherever you play.</h2><p className="mt-6 text-lg leading-8 text-[#486756]">Create public or private groups, run tournaments with live scoring, invite your players, post tee times, share course reviews, and keep every golf conversation in one considered space.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">{[[ 'Private communities', Users ], [ 'Live tournament scoring', Trophy ], [ 'Profiles worth sharing', Medal ], [ 'Tee times with friends', ChevronDown ]].map(([label, Icon]) => { const FeatureIcon = Icon as typeof Users; return <div key={label as string} className="flex items-center gap-3 rounded-2xl bg-[#edf5ee] px-4 py-3 text-sm font-bold text-[#174432]"><FeatureIcon className="h-5 w-5 text-[#258165]" />{label as string}</div> })}</div>
          </div>
          <div className="relative mx-auto w-full max-w-[410px]"><div className="absolute inset-x-8 bottom-0 h-24 rounded-full bg-[#5ca272]/30 blur-3xl" /><div className="relative overflow-hidden rounded-[2.5rem] border-[8px] border-[#153426] bg-[#153426] shadow-2xl shadow-[#0b3021]/30"><Image src="/app-screens/tournament.png" alt="Crossville Cup tournament scoreboard" width={1170} height={2532} className="h-auto w-full" /></div></div>
        </div>
      </section>

      <section className="bg-[#0d3524] px-5 py-20 text-center text-white sm:px-8 sm:py-28"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#e8ca78]">Your next round starts here</p><h2 className={`mt-4 text-5xl leading-[0.98] tracking-[-0.045em] sm:text-6xl ${displayFont.className}`}>Download your new golf clubhouse.</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/72">Join the golfers building stronger local communities—one tee time, tournament, scorecard, and connection at a time.</p><div className="mt-9 flex justify-center"><AppStoreButton /></div>{!user && <Link href="/auth/signup" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#d8f0de] underline decoration-white/30 underline-offset-4 hover:text-white">Or create your account on the web <ArrowRight className="h-4 w-4" /></Link>}</div></section>
    </main>
  )
}
