export type Vocabulary = {
  id: string
  word: string
  meaning: string | null
  exampleSentence: string | null
  notes: string | null
  tags: string | null
  createdAt: string
  updatedAt: string
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}
