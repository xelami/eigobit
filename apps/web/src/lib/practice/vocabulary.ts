import type { VocabularyItem } from "./types"

export async function saveVocabulary(item: VocabularyItem) {
  const response = await fetch("/api/vocabulary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      word: item.word,
      meaning: item.meaning || null,
      exampleSentence: item.exampleSentence || null,
      notes: null,
      tags: null,
    }),
  })

  const data = await response.json().catch(() => null)

  if (response.status === 409) {
    return { saved: true }
  }

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to save vocabulary.")
  }

  return { saved: true }
}
