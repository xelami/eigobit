import { apiFetch } from "../api"
import type {
  PracticePassage,
  PracticeQuestion,
  PracticeSession,
} from "./types"

export async function getPracticeSession(
  sessionId: string,
  Astro: Parameters<typeof apiFetch>[1],
) {
  return apiFetch<{
    session: PracticeSession
    questions: PracticeQuestion[]
  }>(`/api/v1/practice/sessions/${sessionId}`, Astro)
}

export async function getPracticePassages(
  exam: string,
  part: string,
  Astro: Parameters<typeof apiFetch>[1],
) {
  return apiFetch<{
    passages: PracticePassage[]
  }>(
    `/api/v1/practice/passages?exam=${encodeURIComponent(
      exam,
    )}&part=${encodeURIComponent(part)}&limit=20`,
    Astro,
  )
}
