'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import Logo from '@/app/components/Logo'
import ThemeToggle from '@/app/components/ThemeToggle'
import { ArrowLeft, Shield, Eye, Database, Lock, Users, Mail, Phone } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-theme-gradient transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 sticky top-0 z-50 shadow-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href={user ? "/dashboard" : "/"}>
                <Logo size="lg" />
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Link
                href={user ? "/dashboard" : "/"}
                className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{user ? "Back to Dashboard" : "Back to Home"}</span>
              </Link>
              
              <ThemeToggle size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-emerald-500 mr-3" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Privacy Policy
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Privacy Policy Content */}
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-8 sm:p-12 shadow-xl">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Eye className="h-6 w-6 text-emerald-500 mr-2" />
                  Introduction
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  Ultimate Golf Community ("we," "our," or "us") is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                  when you use our golf community platform and services.
                </p>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                  By using our services, you agree to the collection and use of information in accordance 
                  with this Privacy Policy. If you do not agree with our policies and practices, please 
                  do not use our services.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Database className="h-6 w-6 text-emerald-500 mr-2" />
                  Information We Collect
                </h2>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 mb-4 space-y-2">
                  <li>Name, email address, and contact information</li>
                  <li>Profile information including golf handicap, location, and preferences</li>
                  <li>Profile pictures and header images</li>
                  <li>Golf course reviews and ratings</li>
                  <li>Tee time bookings and playing history</li>
                  <li>Messages and communications with other users</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Usage Information</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 mb-4 space-y-2">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Pages visited and features used</li>
                  <li>Time spent on the platform</li>
                  <li>Search queries and preferences</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Location Information</h3>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                  We collect location information to help you find nearby golf courses and tee times. 
                  This includes GPS coordinates when you enable location services, as well as general 
                  location data based on your IP address.
                </p>
              </section>

              {/* How We Use Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Users className="h-6 w-6 text-emerald-500 mr-2" />
                  How We Use Your Information
                </h2>
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 space-y-2">
                  <li>Provide and maintain our golf community platform</li>
                  <li>Match you with compatible playing partners</li>
                  <li>Show you relevant golf courses and tee times</li>
                  <li>Send notifications about bookings and messages</li>
                  <li>Improve our services and user experience</li>
                  <li>Provide customer support</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Lock className="h-6 w-6 text-emerald-500 mr-2" />
                  Information Sharing and Disclosure
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share 
                  your information in the following limited circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 space-y-2">
                  <li><strong>With other users:</strong> Your profile information is visible to other community members</li>
                  <li><strong>Service providers:</strong> Trusted third parties who help us operate our platform</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business transfers:</strong> In connection with mergers or acquisitions</li>
                  <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
                </ul>
              </section>

              {/* Data Security */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Shield className="h-6 w-6 text-emerald-500 mr-2" />
                  Data Security
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure hosting infrastructure</li>
                  <li>Employee training on data protection</li>
                </ul>
              </section>

              {/* Your Rights */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Rights and Choices
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Portability:</strong> Export your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Restriction:</strong> Limit how we process your data</li>
                </ul>
              </section>

              {/* Cookies */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Cookies and Tracking Technologies
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                  and provide personalized content. You can control cookie settings through your browser preferences.
                </p>
              </section>

              {/* Third-Party Services */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Third-Party Services
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  Our platform may integrate with third-party services such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-slate-300 space-y-2">
                  <li>Weather services for course conditions</li>
                  <li>Payment processors for bookings</li>
                  <li>Analytics providers for usage insights</li>
                  <li>Social media platforms for sharing</li>
                </ul>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mt-4">
                  These services have their own privacy policies, and we encourage you to review them.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Children's Privacy
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                  Our services are not intended for children under 13 years of age. We do not knowingly 
                  collect personal information from children under 13. If you are a parent or guardian and 
                  believe your child has provided us with personal information, please contact us.
                </p>
              </section>

              {/* Changes to Policy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Changes to This Privacy Policy
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                  We encourage you to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Mail className="h-6 w-6 text-emerald-500 mr-2" />
                  Contact Us
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
                  <div className="space-y-2">
                    <p className="text-gray-700 dark:text-slate-300">
                      <strong>Email:</strong> privacy@ultimategolfcommunity.com
                    </p>
                    <p className="text-gray-700 dark:text-slate-300">
                      <strong>Address:</strong> Ultimate Golf Community<br />
                      Privacy Department<br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
