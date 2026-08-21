export type PracticeOption = {
  id: string
  label: string
  text: string
}

export type VocabularyItem = {
  word: string
  meaning: string
  exampleSentence: string
  saved: boolean
}

export type PracticeQuestion = {
  id: string
  questionNumber: number
  passageId: string | null
  questionText: string
  questionType: string
  explanation: string | null
  difficulty: string | null
  vocabulary: VocabularyItem[]
  selectedOptionId: string | null
  isCorrect: boolean | null
  options: PracticeOption[]
}

export type PracticeSession = {
  id: string
  exam: string
  part: string
  totalQuestions: number
  correctAnswers: number
  completedAt: string | null
}

export type PracticePassageQuestion = {
  id: string
  questionNumber: number | null
  questionType: string
  questionText: string
  explanation: string | null
  difficulty: string | null
  options: PracticeOption[]
}

export type PracticePassage = {
  id: string
  exam: string
  part: string
  title: string | null
  passageText: string
  difficulty: string | null
  questions: PracticePassageQuestion[]
}
