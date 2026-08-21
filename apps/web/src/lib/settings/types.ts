export interface ExamGoal {
  exam: string
  toeicTargetScore: string | null
  eikenTargetGrade: string | null
}

export interface Preferences {
  englishLevel: string | null
  studyTime: string | null
  learningGoals: string[]
  interests: string[]
  examGoals: ExamGoal[]
}

export interface ConnectedAccounts {
  google: boolean
  apple: boolean
  line: boolean
}

export interface Onboarding {
  profile: {
    englishLevel: string
    studyTime: string
    onboardingCompleted: string | null
  } | null
  learningGoals: string[]
  interests: string[]
  examGoals: ExamGoal[]
}
