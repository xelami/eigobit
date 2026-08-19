CREATE TABLE "practice_session_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"question_number" integer NOT NULL,
	"selected_option_id" uuid,
	"is_correct" boolean,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam" "exam" NOT NULL,
	"part" varchar(10) NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_questions" ADD COLUMN "vocabulary" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_session_questions" ADD CONSTRAINT "practice_session_questions_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_questions" ADD CONSTRAINT "practice_session_questions_question_id_practice_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."practice_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session_questions" ADD CONSTRAINT "practice_session_questions_selected_option_id_practice_question_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."practice_question_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_session_questions_session_id_idx" ON "practice_session_questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "practice_session_questions_question_id_idx" ON "practice_session_questions" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "practice_sessions_user_id_idx" ON "practice_sessions" USING btree ("user_id");