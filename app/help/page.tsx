import Link from 'next/link'
import { Calendar, LifeBuoy, MessageCircle, Trophy, Users } from 'lucide-react'

const sections = [
  {
    title: 'Post a Tee Time',
    icon: Calendar,
    steps: [
      'Open the dashboard and choose "Post a Tee Time."',
      'Add the course, zip code, date, time, and number of players you need.',
      'Choose whether the round is public, for connections only, or inside one of your groups.',
      'Publish it and the round will appear in the tee time feed.'
    ]
  },
  {
    title: 'Join a Group',
    icon: Trophy,
    steps: [
      'Go to the Groups tab on the dashboard.',
      'Browse top local groups or search by course, city, or community name.',
      'Tap "Join" on a group you want to be part of.',
      'Once you are in, open the board to read posts, join the conversation, and see group tee times.'
    ]
  },
  {
    title: 'Build Connections',
    icon: Users,
    steps: [
      'Click your avatar in the top-left corner and open "My Profile."',
      'Use the connections area to search for golfers and send requests.',
      'Accept incoming requests from golfers you know or have played with.',
      'Once connected, you can message them and invite them into your groups.'
    ]
  },
  {
    title: 'Use Inbox and Messages',
    icon: MessageCircle,
    steps: [
      'Open your avatar menu and choose "Inbox."',
      'Select an existing conversation or start a new one.',
      'Use messages to coordinate rounds, answer group invites, or follow up with new connections.'
    ]
  }
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#07140f] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,rgba(14,35,29,0.96),rgba(8,20,15,0.98))] p-8 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/12 p-3">
              <LifeBuoy className="h-6 w-6 text-emerald-200" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/70">Help & Support</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">How Ultimate Golf Community works</h1>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/62">
            This page breaks down the core parts of the app so players can understand where to post rounds,
            how to join groups, and how to stay connected with the golfers they meet.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon

            return (
              <div
                key={section.title}
                className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/8 p-3">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {section.steps.map((step, index) => (
                    <div key={step} className="flex gap-3 rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-200">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-7 text-white/70">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
          <p className="text-sm text-white/60">
            Need to update your personal details or home course? Visit your full profile page.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-100"
          >
            Open Full Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
