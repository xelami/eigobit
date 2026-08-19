import { relations } from "drizzle-orm/relations";
import { users, sessions, userVocabulary, passwordResetTokens, practicePassages, practiceQuestions, practiceQuestionOptions, accounts, oauthLinkStates, practiceSessions, practiceSessionQuestions, userExamGoals, userInterests, userLearningGoals, userProfiles } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	userVocabularies: many(userVocabulary),
	passwordResetTokens: many(passwordResetTokens),
	accounts: many(accounts),
	oauthLinkStates: many(oauthLinkStates),
	practiceSessions: many(practiceSessions),
	userExamGoals: many(userExamGoals),
	userInterests: many(userInterests),
	userLearningGoals: many(userLearningGoals),
	userProfiles: many(userProfiles),
}));

export const userVocabularyRelations = relations(userVocabulary, ({one}) => ({
	user: one(users, {
		fields: [userVocabulary.userId],
		references: [users.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const practiceQuestionsRelations = relations(practiceQuestions, ({one, many}) => ({
	practicePassage: one(practicePassages, {
		fields: [practiceQuestions.passageId],
		references: [practicePassages.id]
	}),
	practiceQuestionOptions: many(practiceQuestionOptions),
	practiceSessionQuestions: many(practiceSessionQuestions),
}));

export const practicePassagesRelations = relations(practicePassages, ({many}) => ({
	practiceQuestions: many(practiceQuestions),
}));

export const practiceQuestionOptionsRelations = relations(practiceQuestionOptions, ({one, many}) => ({
	practiceQuestion: one(practiceQuestions, {
		fields: [practiceQuestionOptions.questionId],
		references: [practiceQuestions.id]
	}),
	practiceSessionQuestions: many(practiceSessionQuestions),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const oauthLinkStatesRelations = relations(oauthLinkStates, ({one}) => ({
	user: one(users, {
		fields: [oauthLinkStates.userId],
		references: [users.id]
	}),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({one, many}) => ({
	user: one(users, {
		fields: [practiceSessions.userId],
		references: [users.id]
	}),
	practiceSessionQuestions: many(practiceSessionQuestions),
}));

export const practiceSessionQuestionsRelations = relations(practiceSessionQuestions, ({one}) => ({
	practiceSession: one(practiceSessions, {
		fields: [practiceSessionQuestions.sessionId],
		references: [practiceSessions.id]
	}),
	practiceQuestion: one(practiceQuestions, {
		fields: [practiceSessionQuestions.questionId],
		references: [practiceQuestions.id]
	}),
	practiceQuestionOption: one(practiceQuestionOptions, {
		fields: [practiceSessionQuestions.selectedOptionId],
		references: [practiceQuestionOptions.id]
	}),
}));

export const userExamGoalsRelations = relations(userExamGoals, ({one}) => ({
	user: one(users, {
		fields: [userExamGoals.userId],
		references: [users.id]
	}),
}));

export const userInterestsRelations = relations(userInterests, ({one}) => ({
	user: one(users, {
		fields: [userInterests.userId],
		references: [users.id]
	}),
}));

export const userLearningGoalsRelations = relations(userLearningGoals, ({one}) => ({
	user: one(users, {
		fields: [userLearningGoals.userId],
		references: [users.id]
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({one}) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id]
	}),
}));