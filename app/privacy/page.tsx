'use client'

import Link from 'next/link'
import { ArrowLeft, Database, Eye, Lock, Mail, Shield, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/app/components/Logo'
import ThemeToggle from '@/app/components/ThemeToggle'

const summaryCards = [
  {
    title: 'What we collect',
    description: 'Basic account details, profile data, activity on the platform, and service-related usage information.',
    icon: Database,
  },
  {
    title: 'Why we use it',
    description: 'To run the platform, improve the community experience, support safety, and keep core features working.',
    icon: Eye,
  },
  {
    title: 'How we protect it',
    description: 'We use hosted infrastructure, access controls, and standard security practices to reduce risk.',
    icon: Lock,
  },
]

const sections = [
  {
    title: 'Introduction',
    icon: Shield,
    content: [
      'Ultimate Golf Community ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and related services.',
      'By using our services, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with these practices, please do not use the platform.',
    ],
  },
  {
    title: 'Information We Collect',
    icon: Database,
    bullets: [
      'Account details such as name, email address, username, and contact information.',
      'Profile information including handicap, location, preferences, profile images, and activity you choose to post.',
      'Golf-related usage such as group participation, messages, bookings, reviews, and round-related interactions.',
      'Technical and usage information such as device type, browser type, pages visited, and general platform activity.',
      'Location information when used to help surface nearby courses, groups, or relevant golf activity.',
    ],
  },
  {
    title: 'How We Use Information',
    icon: Users,
    bullets: [
      'To provide and maintain the Ultimate Golf Community platform.',
      'To help users discover relevant groups, courses, events, and playing opportunities.',
      'To support communication, notifications, account access, and platform functionality.',
      'To improve the product, understand usage patterns, and refine the user experience.',
      'To support customer service, security, fraud prevention, and abuse monitoring.',
      'To send product or marketing communications when permitted by law or your preferences.',
    ],
  },
  {
    title: 'Information Sharing',
    icon: Lock,
    content: [
      'We do not sell your personal information. We may share information with service providers that help us operate the platform, with other users where your profile or community activity is inherently visible, when required by law, or in connection with a business transfer such as a merger or acquisition.',
      'We may also share information when you explicitly direct us to do so or consent to a particular disclosure.',
    ],
  },
  {
    title: 'Data Security',
    icon: Shield,
    bullets: [
      'Data encryption in transit where applicable.',
      'Hosted infrastructure and access controls designed to reduce unauthorized access.',
      'Reasonable administrative, technical, and operational safeguards.',
      'Ongoing maintenance and updates intended to protect platform integrity.',
    ],
  },
  {
    title: 'Your Choices',
    icon: Eye,
    bullets: [
      'Access or update account details through your profile and settings where available.',
      'Request correction or deletion of personal information, subject to legal or operational limits.',
      'Manage communication preferences and opt out of non-essential marketing messages.',
      'Contact us if you need help understanding, exporting, or requesting changes to your data.',
    ],
  },
  {
    title: 'Cookies and Third-Party Services',
    icon: Database,
    content: [
      'We may use cookies or similar technologies to support authentication, performance, analytics, and feature behavior. You can manage many cookie settings through your browser.',
      'Our platform may also rely on third-party providers such as hosting, analytics, weather, payments, or authentication services. Those providers operate under their own terms and privacy policies.',
    ],
  },
  {
    title: 'Children’s Privacy',
    icon: Shield,
    content: [
      'Our services are not intended for children under 13 years of age, and we do not knowingly collect personal information from children under 13. If you believe a child has submitted personal information to us, please contact us so we can review and address the issue.',
    ],
  },
  {
    title: 'Policy Updates',
    icon: Eye,
    content: [
      'We may update this Privacy Policy from time to time. When we do, we will update the effective date on this page and post the revised version here. Continued use of the platform after changes are posted may constitute acceptance of the updated policy.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#07140f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07140f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:h-24 sm:px-6 lg:px-8">
          <Link href={user ? '/dashboard' : '/'}>
            <div className="origin-left scale-[0.92] sm:scale-100">
              <Logo size="md" />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={user ? '/dashboard' : '/'}
              className="inline-flex items-center rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5 hover:text-white sm:px-4"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{user ? 'Back to Dashboard' : 'Back to Home'}</span>
            </Link>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_26%),radial-gradient(circle_at_85%_0%,rgba(125,211,252,0.18),transparent_24%)]" />
          <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-20 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
                Privacy Policy
              </p>
              <h1 className="mt-4 max-w-3xl text-[2.45rem] font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:mt-5 sm:text-6xl lg:text-7xl">
                Privacy and data use, explained more clearly.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:mt-8 sm:text-xl sm:leading-8">
                This page explains what information Ultimate Golf Community may collect, how it may be
                used, and the choices available to you when you use the platform.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 sm:mt-8">
                Effective date: April 6, 2026
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            {summaryCards.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(160deg,rgba(14,35,29,0.92),rgba(8,20,15,0.96))] p-5 sm:rounded-[1.9rem] sm:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 sm:h-14 sm:w-14">
                  <Icon className="h-5 w-5 text-emerald-200 sm:h-6 sm:w-6" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-white sm:mt-5 sm:text-2xl">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-white/68 sm:mt-3 sm:text-base sm:leading-8">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
            <div className="space-y-4 sm:space-y-6">
              {sections.map(({ title, icon: Icon, content, bullets }) => (
                <section
                  key={title}
                  className="rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:rounded-[2rem] sm:p-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/6 sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 text-emerald-200" />
                    </div>
                    <h2 className="text-[1.45rem] font-semibold leading-tight text-white sm:text-3xl">{title}</h2>
                  </div>

                  {content && (
                    <div className="mt-5 space-y-4 text-[15px] leading-7 text-white/68 sm:mt-6 sm:text-base sm:leading-8">
                      {content.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  )}

                  {bullets && (
                    <div className="mt-5 space-y-3 sm:mt-6">
                      {bullets.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3.5 text-[15px] leading-7 text-white/70 sm:py-4 sm:text-base"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <aside className="h-fit rounded-[1.7rem] border border-white/8 bg-[#081711] p-5 sm:rounded-[2rem] sm:p-7 lg:sticky lg:top-32">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Questions?
              </p>
              <h2 className="mt-3 text-[1.8rem] font-semibold leading-tight text-white sm:mt-4 sm:text-3xl">Contact us about privacy.</h2>
              <p className="mt-4 text-[15px] leading-7 text-white/68 sm:mt-5 sm:text-base sm:leading-8">
                If you have questions about this policy or want to make a data-related request, reach out
                and we will review it.
              </p>

              <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/5 p-4 sm:mt-8 sm:rounded-[1.6rem] sm:p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-5 w-5 text-emerald-200" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-white/45">Email</p>
                    <a
                      href="mailto:privacy@ultimategolfcommunity.com"
                      className="mt-2 block break-all text-base font-medium text-white transition hover:text-emerald-200"
                    >
                      privacy@ultimategolfcommunity.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-white/5 p-4 text-[15px] leading-7 text-white/65 sm:mt-5 sm:rounded-[1.6rem] sm:p-5 sm:text-base sm:leading-8">
                Ultimate Golf Community
                <br />
                Privacy Requests
                <br />
                San Francisco, CA 94105
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}
