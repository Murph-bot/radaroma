// Named weight presets — most visitors won't drag five sliders, so four
// moods do the steering. They are plain Weights: the chips call the same
// setWeights the sliders use, and rankCafes stays the only ranker.
import type { Weights } from "./ranking"

export type MoodId = "laptopDay" | "talk" | "filterNerd" | "goodCheap"

export interface Mood {
  id: MoodId
  label: string
  weights: Weights
}

export const MOODS: Mood[] = [
  {
    id: "laptopDay",
    label: "Laptop day",
    weights: {
      quality: 1,
      priceValue: 1.2,
      workFriendliness: 2,
      quietVibe: 1.8,
      specialtyDepth: 0.8,
    },
  },
  {
    id: "talk",
    label: "Talk",
    weights: {
      quality: 1.4,
      priceValue: 1,
      workFriendliness: 0.6,
      quietVibe: 0.3,
      specialtyDepth: 1,
    },
  },
  {
    id: "filterNerd",
    label: "Filter nerd",
    weights: {
      quality: 1.8,
      priceValue: 0.8,
      workFriendliness: 0.6,
      quietVibe: 1.2,
      specialtyDepth: 2,
    },
  },
  {
    id: "goodCheap",
    label: "Good & cheap",
    weights: {
      quality: 1,
      priceValue: 2,
      workFriendliness: 0.8,
      quietVibe: 0.8,
      specialtyDepth: 0.6,
    },
  },
]

export function moodWeights(id: MoodId): Weights {
  const mood = MOODS.find((m) => m.id === id)
  if (!mood) throw new Error(`unknown mood: ${id}`)
  return { ...mood.weights }
}
