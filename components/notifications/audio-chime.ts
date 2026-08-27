"use client"

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      audioCtx = new AudioCtx()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function playTone(freq: number, duration: number, startTime: number, gainNode: GainNode, ctx: AudioContext) {
  const osc = ctx.createOscillator()
  osc.type = "sine"
  osc.frequency.setValueAtTime(freq, startTime)
  osc.connect(gainNode)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/**
 * Plays an attention chime for human-in-the-loop approval requests.
 */
export function playApprovalChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.12, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
  gain.connect(ctx.destination)

  playTone(587.33, 0.25, now, gain, ctx) // D5
  playTone(880.0, 0.35, now + 0.15, gain, ctx) // A5
}

/**
 * Plays a pleasant chime for due task reminders.
 */
export function playReminderChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.1, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
  gain.connect(ctx.destination)

  playTone(523.25, 0.18, now, gain, ctx) // C5
  playTone(659.25, 0.18, now + 0.12, gain, ctx) // E5
  playTone(783.99, 0.35, now + 0.24, gain, ctx) // G5
}

/**
 * Plays an ascending chime when a deliverable is completed or brief is ingested.
 */
export function playSuccessChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.1, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
  gain.connect(ctx.destination)

  playTone(440.0, 0.15, now, gain, ctx) // A4
  playTone(554.37, 0.15, now + 0.1, gain, ctx) // C#5
  playTone(659.25, 0.15, now + 0.2, gain, ctx) // E5
  playTone(880.0, 0.4, now + 0.3, gain, ctx) // A5
}
