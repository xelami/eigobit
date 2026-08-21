DROP INDEX "practice_sessions_user_id_idx";--> statement-breakpoint
CREATE INDEX "practice_sessions_user_completed_idx" ON "practice_sessions" USING btree ("user_id","completed_at");