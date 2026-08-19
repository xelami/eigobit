import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
  unique,
  index,
  text,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core"

/*
 * ============================================================================
 * ENUMS
 * ============================================================================
 */

export const authProviderEnum = pgEnum("auth_provider", [
  "google",
  "apple",
  "line",
])

export const learningGoalEnum = pgEnum("learning_goal", [
  "toeic",
  "eiken",
  "improve_english",
  "speaking",
  "vocabulary",
  "listening",
  "reading",
  "writing",
  "school",
  "work",
  "casual",
])

export const englishLevelEnum = pgEnum("english_level", [
  "beginner",
  "elementary",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "unknown",
])

export const studyTimeEnum = pgEnum("study_time", [
  "5",
  "10",
  "20",
  "30",
  "60",
  "whenever",
])

export const eikenGradeEnum = pgEnum("eiken_grade", [
  "grade_5",
  "grade_4",
  "grade_3",
  "pre_2",
  "pre_2_plus",
  "grade_2",
  "pre_1",
  "grade_1",
])

export const examEnum = pgEnum("exam", ["toeic", "eiken"])

/*
 * ============================================================================
 * USERS
 * ============================================================================
 */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: varchar("email", {
      length: 255,
    }),

    passwordHash: varchar("password_hash", {
      length: 255,
    }),

    name: varchar("name", {
      length: 100,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("users_email_unique").on(table.email)],
)

/*
 * ============================================================================
 * AUTHENTICATION ACCOUNTS
 *
 * Links an external OAuth identity to one of our users.
 *
 * Example:
 *
 * user
 *   ├── Google → Google account ID
 *   ├── LINE   → LINE user ID
 *   └── Apple  → Apple subject
 *
 * ============================================================================
 */

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    provider: authProviderEnum("provider").notNull(),

    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("accounts_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),

    index("accounts_user_id_idx").on(table.userId),
  ],
)

/*
 * ============================================================================
 * SESSIONS
 * ============================================================================
 *
 * The raw session token is NEVER stored.
 *
 * We store:
 *
 * SHA-256(sessionToken)
 *
 * ============================================================================
 */

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    tokenHash: varchar("token_hash", {
      length: 64,
    }).notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("sessions_token_hash_unique").on(table.tokenHash),

    index("sessions_user_id_idx").on(table.userId),
  ],
)

export const oauthLinkStates = pgTable("oauth_link_states", {
  id: uuid("id").defaultRandom().primaryKey(),

  state: text("state").notNull().unique(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  provider: text("provider").notNull(),

  codeVerifier: text("code_verifier").notNull(),

  expiresAt: timestamp("expires_at", {
    withTimezone: true,
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
})

/*
 * ============================================================================
 * PASSWORD RESET TOKENS
 * ============================================================================
 *
 * The raw reset token is NEVER stored.
 *
 * We store:
 *
 * SHA-256(resetToken)
 *
 * ============================================================================
 */

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    tokenHash: varchar("token_hash", {
      length: 64,
    }).notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    usedAt: timestamp("used_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("password_reset_tokens_hash_unique").on(table.tokenHash),

    index("password_reset_tokens_user_id_idx").on(table.userId),
  ],
)

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    englishLevel: englishLevelEnum("english_level")
      .notNull()
      .default("unknown"),

    studyTime: studyTimeEnum("study_time").notNull().default("whenever"),

    onboardingCompleted: timestamp("onboarding_completed", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("user_profiles_user_id_unique").on(table.userId)],
)

export const userLearningGoals = pgTable(
  "user_learning_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    goal: learningGoalEnum("goal").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("user_learning_goals_unique").on(table.userId, table.goal),

    index("user_learning_goals_user_id_idx").on(table.userId),
  ],
)

export const userExamGoals = pgTable(
  "user_exam_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    exam: examEnum("exam").notNull(),

    toeicTargetScore: varchar("toeic_target_score", {
      length: 10,
    }),

    eikenTargetGrade: eikenGradeEnum("eiken_target_grade"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("user_exam_goals_unique").on(table.userId, table.exam),

    index("user_exam_goals_user_id_idx").on(table.userId),
  ],
)

export const userInterests = pgTable(
  "user_interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    interest: varchar("interest", {
      length: 50,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("user_interests_unique").on(table.userId, table.interest),

    index("user_interests_user_id_idx").on(table.userId),
  ],
)

/*
 * ============================================================================
 * USER VOCABULARY
 * ============================================================================
 *
 * Personal vocabulary saved by each user.
 *
 * A user can save any English word or phrase they want.
 *
 * ============================================================================
 */

export const userVocabulary = pgTable(
  "user_vocabulary",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    word: varchar("word", {
      length: 100,
    }).notNull(),

    meaning: text("meaning"),

    exampleSentence: text("example_sentence"),

    notes: text("notes"),

    tags: text("tags"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_vocabulary_user_id_idx").on(table.userId),

    unique("user_vocabulary_user_word_unique").on(table.userId, table.word),
  ],
)

/*
 * ============================================================================
 * PRACTICE QUESTIONS
 * ============================================================================
 */

export const practiceExamEnum = pgEnum("practice_exam", ["toeic", "eiken"])

export const practiceQuestionTypeEnum = pgEnum("practice_question_type", [
  "multiple_choice",
  "sentence_insertion",
])

export const practiceQuestions = pgTable(
  "practice_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    exam: practiceExamEnum("exam").notNull(),

    part: varchar("part", {
      length: 20,
    }).notNull(),

    passageId: uuid("passage_id").references(
      () => practicePassages.id,

      {
        onDelete: "cascade",
      },
    ),

    passageQuestionNumber: integer("passage_question_number"),

    questionType: practiceQuestionTypeEnum("question_type")
      .notNull()
      .default("multiple_choice"),

    questionText: text("question_text").notNull(),

    explanation: text("explanation"),

    difficulty: varchar("difficulty", {
      length: 30,
    }),

    vocabulary: jsonb("vocabulary")
      .$type<
        {
          word: string
          meaning: string
          exampleSentence: string
        }[]
      >()
      .notNull()
      .default([]),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("practice_questions_exam_part_idx").on(table.exam, table.part),
    index("practice_questions_passage_id_idx").on(table.passageId),
  ],
)

/*
 * ============================================================================
 * PRACTICE QUESTION OPTIONS
 * ============================================================================
 */

export const practiceQuestionOptions = pgTable(
  "practice_question_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    questionId: uuid("question_id")
      .notNull()
      .references(() => practiceQuestions.id, {
        onDelete: "cascade",
      }),

    optionLabel: varchar("option_label", {
      length: 1,
    }).notNull(),

    optionText: text("option_text").notNull(),

    isCorrect: boolean("is_correct").notNull().default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("practice_question_options_unique").on(
      table.questionId,
      table.optionLabel,
    ),

    index("practice_question_options_question_id_idx").on(table.questionId),
  ],
)

export const practiceSessions = pgTable(
  "practice_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    exam: examEnum("exam").notNull(),

    part: varchar("part", {
      length: 10,
    }).notNull(),

    totalQuestions: integer("total_questions").notNull(),

    correctAnswers: integer("correct_answers").notNull().default(0),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("practice_sessions_user_id_idx").on(table.userId)],
)

export const practiceSessionQuestions = pgTable(
  "practice_session_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => practiceSessions.id, {
        onDelete: "cascade",
      }),

    questionId: uuid("question_id")
      .notNull()
      .references(() => practiceQuestions.id, {
        onDelete: "cascade",
      }),

    questionNumber: integer("question_number").notNull(),

    selectedOptionId: uuid("selected_option_id").references(
      () => practiceQuestionOptions.id,
      {
        onDelete: "set null",
      },
    ),

    isCorrect: boolean("is_correct"),

    answeredAt: timestamp("answered_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("practice_session_questions_session_id_idx").on(table.sessionId),

    index("practice_session_questions_question_id_idx").on(table.questionId),
  ],
)

/*
 * ============================================================================
 * PRACTICE PASSAGES
 * ============================================================================
 *
 * Used by TOEIC Part 6 and Part 7.
 *
 * A passage can contain multiple questions.
 *
 * Examples:
 *
 * Part 6:
 *   Passage → 4 questions
 *
 * Part 7:
 *   Passage → 2-5 questions
 *
 * ============================================================================
 */

/*
 * ============================================================================
 * PRACTICE PASSAGES
 * ============================================================================
 */

export const practicePassages = pgTable(
  "practice_passages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    exam: practiceExamEnum("exam").notNull(),

    part: varchar("part", {
      length: 20,
    }).notNull(),

    title: varchar("title", {
      length: 255,
    }),

    passageText: text("passage_text").notNull(),

    difficulty: varchar("difficulty", {
      length: 30,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("practice_passages_exam_part_idx").on(table.exam, table.part),
  ],
)
