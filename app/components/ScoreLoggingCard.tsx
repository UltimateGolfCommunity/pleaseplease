'use client'

import { useEffect, useMemo, useState } from 'react'
import { Flag, Loader2, MapPinned, Plus, Target, Trophy } from 'lucide-react'
import { logRoundLogged } from '@/lib/activity-logger'

interface ScoreRound {
  id: string
  course_name: string
  holes_played: number
  hole_scores: number[]
  total_score: number
  average_score_per_hole: number
  played_at: string
}

interface ScoreLoggingCardProps {
  userId: string
  homeCourse?: string | null
}

function buildHoleScores(count: number) {
  return Array.from({ length: count }, () => '')
}

export default function ScoreLoggingCard({ userId, homeCourse }: ScoreLoggingCardProps) {
  const [rounds, setRounds] = useState<ScoreRound[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18)
  const [courseName, setCourseName] = useState(homeCourse || '')
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0])
  const [holeScores, setHoleScores] = useState<string[]>(buildHoleScores(18))

  const loadRounds = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/scores?user_id=${userId}`)
      const data = await response.json()
      setRounds(data.rounds || [])
    } catch (error) {
      console.error('Error loading rounds:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadRounds()
    }
  }, [userId])

  useEffect(() => {
    setHoleScores((previous) => {
      const next = buildHoleScores(holesPlayed)
      previous.slice(0, holesPlayed).forEach((score, index) => {
        next[index] = score
      })
      return next
    })
  }, [holesPlayed])

  useEffect(() => {
    if (homeCourse && !courseName) {
      setCourseName(homeCourse)
    }
  }, [homeCourse, courseName])

  const numericScores = useMemo(
    () => holeScores.map((score) => Number(score)).filter((score) => Number.isFinite(score) && score > 0),
    [holeScores]
  )

  const totalScore = useMemo(
    () => numericScores.reduce((sum, score) => sum + score, 0),
    [numericScores]
  )

  const averageScore = useMemo(
    () => (numericScores.length ? totalScore / numericScores.length : 0),
    [numericScores.length, totalScore]
  )

  const lifetimeAveragePerHole = useMemo(() => {
    const totals = rounds.reduce(
      (accumulator, round) => {
        return {
          score: accumulator.score + round.total_score,
          holes: accumulator.holes + round.holes_played
        }
      },
      { score: 0, holes: 0 }
    )

    return totals.holes ? totals.score / totals.holes : 0
  }, [rounds])

  const recentBestRound = useMemo(() => {
    if (rounds.length === 0) return null
    return [...rounds].sort((a, b) => a.total_score - b.total_score)[0]
  }, [rounds])

  const resetForm = () => {
    setCourseName(homeCourse || '')
    setPlayedAt(new Date().toISOString().split('T')[0])
    setHoleScores(buildHoleScores(holesPlayed))
  }

  const submitRound = async () => {
    if (!courseName.trim()) {
      alert('Please add the course name for this round.')
      return
    }

    if (numericScores.length !== holesPlayed) {
      alert(`Please enter a score for all ${holesPlayed} holes.`)
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          course_name: courseName.trim(),
          holes_played: holesPlayed,
          hole_scores: numericScores,
          played_at: playedAt
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Unable to save round')
        return
      }

      await logRoundLogged(userId, courseName.trim(), totalScore)
      setShowForm(false)
      resetForm()
      await loadRounds()
    } catch (error) {
      console.error('Error saving round:', error)
      alert('Unable to save this scorecard right now')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">Score Tracking</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Log every hole</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">
            Save 9 or 18-hole rounds, keep your home course handy, and watch your average score per hole settle over time.
          </p>
        </div>

        <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Close scorecard' : 'Log a round'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-amber-200">
            <Target className="h-5 w-5" />
            <p className="text-sm font-semibold text-white">Average per hole</p>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">
            {lifetimeAveragePerHole ? lifetimeAveragePerHole.toFixed(2) : '--'}
          </p>
          <p className="mt-2 text-sm text-white/55">Based on every round you have logged.</p>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-emerald-200">
            <Trophy className="h-5 w-5" />
            <p className="text-sm font-semibold text-white">Best recent card</p>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">
            {recentBestRound ? recentBestRound.total_score : '--'}
          </p>
          <p className="mt-2 text-sm text-white/55">
            {recentBestRound ? `${recentBestRound.course_name} • ${recentBestRound.holes_played} holes` : 'Start logging to build this out.'}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-sky-200">
            <MapPinned className="h-5 w-5" />
            <p className="text-sm font-semibold text-white">Home course</p>
          </div>
          <p className="mt-4 text-xl font-semibold text-white">{homeCourse || 'Add your home course in profile'}</p>
          <p className="mt-2 text-sm text-white/55">This will prefill new scorecards.</p>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-slate-950/45 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-white/75">Course name</label>
              <input
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
                placeholder="Augusta National"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/75">Played on</label>
              <input
                type="date"
                value={playedAt}
                onChange={(event) => setPlayedAt(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/75">Round length</label>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                {[9, 18].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHolesPlayed(option as 9 | 18)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      holesPlayed === option ? 'bg-white text-slate-950' : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {option} holes
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: holesPlayed }).map((_, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Hole {index + 1}
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={holeScores[index] || ''}
                  onChange={(event) => {
                    const next = [...holeScores]
                    next[index] = event.target.value
                    setHoleScores(next)
                  }}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-lg font-semibold text-white outline-none"
                  placeholder="-"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Total</p>
                <p className="mt-1 text-2xl font-semibold text-white">{totalScore || '--'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Avg / Hole</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {averageScore ? averageScore.toFixed(2) : '--'}
                </p>
              </div>
            </div>

            <button
              onClick={submitRound}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              {saving ? 'Saving round...' : 'Save scorecard'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Recent rounds</h4>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
        </div>

        <div className="mt-4 space-y-3">
          {!loading && rounds.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/5 px-5 py-8 text-center text-sm text-white/50">
              No scorecards yet. Log your first round to start tracking hole-by-hole trends.
            </div>
          ) : (
            rounds.slice(0, 5).map((round) => (
              <div key={round.id} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{round.course_name}</p>
                    <p className="mt-1 text-sm text-white/50">
                      {new Date(round.played_at).toLocaleDateString()} • {round.holes_played} holes
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Total</p>
                      <p className="text-xl font-semibold text-white">{round.total_score}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Avg / Hole</p>
                      <p className="text-xl font-semibold text-white">{round.average_score_per_hole.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
