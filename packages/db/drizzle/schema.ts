import { pgTable, unique, uuid, varchar, timestamp, index, foreignKey, text, jsonb, integer, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const authProvider = pgEnum("auth_provider", ['google', 'apple', 'line'])
export const eikenGrade = pgEnum("eiken_grade", ['grade_5', 'grade_4', 'grade_3', 'pre_2', 'pre_2_plus', 'grade_2', 'pre_1', 'grade_1'])
export const englishLevel = pgEnum("english_level", ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'unknown'])
export const exam = pgEnum("exam", ['toeic', 'eiken'])
export const learningGoal = pgEnum("learning_goal", ['toeic', 'eiken', 'improve_english', 'speaking', 'vocabulary', 'listening', 'reading', 'writing', 'school', 'work', 'casual'])
export const practiceExam = pgEnum("practice_exam", ['toeic', 'eiken'])
export const practiceQuestionType = pgEnum("practice_question_type", ['multiple_choice', 'sentence_insertion'])
export const studyTime = pgEnum("study_time", ['5', '10', '20', '30', '60', 'whenever'])


export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }),
	passwordHash: varchar("password_hash", { length: 255 }),
	name: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	userId: uuid("user_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_hash_unique").on(table.tokenHash),
]);

export const userVocabulary = pgTable("user_vocabulary", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	word: varchar({ length: 100 }).notNull(),
	meaning: text(),
	exampleSentence: text("example_sentence"),
	notes: text(),
	tags: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_vocabulary_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_vocabulary_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_vocabulary_user_word_unique").on(table.word, table.userId),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("password_reset_tokens_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_hash_unique").on(table.tokenHash),
]);

export const practiceQuestions = pgTable("practice_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	exam: practiceExam().notNull(),
	part: varchar({ length: 20 }).notNull(),
	questionType: practiceQuestionType("question_type").default('multiple_choice').notNull(),
	questionText: text("question_text").notNull(),
	explanation: text(),
	difficulty: varchar({ length: 30 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	vocabulary: jsonb().default([]).notNull(),
	passageId: uuid("passage_id"),
	passageQuestionNumber: integer("passage_question_number"),
}, (table) => [
	index("practice_questions_exam_part_idx").using("btree", table.exam.asc().nullsLast().op("text_ops"), table.part.asc().nullsLast().op("text_ops")),
	index("practice_questions_passage_id_idx").using("btree", table.passageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.passageId],
			foreignColumns: [practicePassages.id],
			name: "practice_questions_passage_id_practice_passages_id_fk"
		}).onDelete("cascade"),
]);

export const practiceQuestionOptions = pgTable("practice_question_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionId: uuid("question_id").notNull(),
	optionLabel: varchar("option_label", { length: 1 }).notNull(),
	optionText: text("option_text").notNull(),
	isCorrect: boolean("is_correct").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("practice_question_options_question_id_idx").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [practiceQuestions.id],
			name: "practice_question_options_question_id_practice_questions_id_fk"
		}).onDelete("cascade"),
	unique("practice_question_options_unique").on(table.questionId, table.optionLabel),
]);

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	provider: authProvider().notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("accounts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("accounts_provider_account_unique").on(table.providerAccountId, table.provider),
]);

export const oauthLinkStates = pgTable("oauth_link_states", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	state: text().notNull(),
	userId: uuid("user_id").notNull(),
	provider: text().notNull(),
	codeVerifier: text("code_verifier").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "oauth_link_states_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("oauth_link_states_state_unique").on(table.state),
]);

export const practiceSessions = pgTable("practice_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	exam: exam().notNull(),
	part: varchar({ length: 10 }).notNull(),
	totalQuestions: integer("total_questions").notNull(),
	correctAnswers: integer("correct_answers").default(0).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("practice_sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "practice_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const practiceSessionQuestions = pgTable("practice_session_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	questionId: uuid("question_id").notNull(),
	questionNumber: integer("question_number").notNull(),
	selectedOptionId: uuid("selected_option_id"),
	isCorrect: boolean("is_correct"),
	answeredAt: timestamp("answered_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("practice_session_questions_question_id_idx").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	index("practice_session_questions_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [practiceSessions.id],
			name: "practice_session_questions_session_id_practice_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [practiceQuestions.id],
			name: "practice_session_questions_question_id_practice_questions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.selectedOptionId],
			foreignColumns: [practiceQuestionOptions.id],
			name: "practice_session_questions_selected_option_id_practice_question"
		}).onDelete("set null"),
]);

export const userExamGoals = pgTable("user_exam_goals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	exam: exam().notNull(),
	toeicTargetScore: varchar("toeic_target_score", { length: 10 }),
	eikenTargetGrade: eikenGrade("eiken_target_grade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_exam_goals_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_exam_goals_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_exam_goals_unique").on(table.userId, table.exam),
]);

export const userInterests = pgTable("user_interests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	interest: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_interests_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_interests_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_interests_unique").on(table.userId, table.interest),
]);

export const userLearningGoals = pgTable("user_learning_goals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	goal: learningGoal().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_learning_goals_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_learning_goals_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_learning_goals_unique").on(table.userId, table.goal),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	englishLevel: englishLevel("english_level").default('unknown').notNull(),
	studyTime: studyTime("study_time").default('whenever').notNull(),
	onboardingCompleted: timestamp("onboarding_completed", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_profiles_user_id_unique").on(table.userId),
]);

export const practicePassages = pgTable("practice_passages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	exam: practiceExam().notNull(),
	part: varchar({ length: 20 }).notNull(),
	passageType: varchar("passage_type", { length: 30 }),
	title: varchar({ length: 255 }),
	content: text().notNull(),
	difficulty: varchar({ length: 30 }),
	vocabulary: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("practice_passages_exam_part_idx").using("btree", table.exam.asc().nullsLast().op("text_ops"), table.part.asc().nullsLast().op("text_ops")),
]);
