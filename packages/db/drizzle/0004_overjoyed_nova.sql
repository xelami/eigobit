CREATE TYPE "public"."eiken_grade" AS ENUM('grade_5', 'grade_4', 'grade_3', 'pre_2', 'pre_2_plus', 'grade_2', 'pre_1', 'grade_1');--> statement-breakpoint
CREATE TYPE "public"."english_level" AS ENUM('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."exam" AS ENUM('toeic', 'eiken');--> statement-breakpoint
CREATE TYPE "public"."learning_goal" AS ENUM('toeic', 'eiken', 'improve_english', 'speaking', 'vocabulary', 'listening', 'reading', 'writing', 'school', 'work', 'casual');--> statement-breakpoint
CREATE TYPE "public"."study_time" AS ENUM('5', '10', '20', '30', '60', 'whenever');--> statement-breakpoint
CREATE TABLE "user_exam_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam" "exam" NOT NULL,
	"toeic_target_score" varchar(10),
	"eiken_target_grade" "eiken_grade",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_exam_goals_unique" UNIQUE("user_id","exam")
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"interest" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_interests_unique" UNIQUE("user_id","interest")
);
--> statement-breakpoint
CREATE TABLE "user_learning_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal" "learning_goal" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_learning_goals_unique" UNIQUE("user_id","goal")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"english_level" "english_level" DEFAULT 'unknown' NOT NULL,
	"study_time" "study_time" DEFAULT 'whenever' NOT NULL,
	"onboarding_completed" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_exam_goals" ADD CONSTRAINT "user_exam_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_learning_goals" ADD CONSTRAINT "user_learning_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_exam_goals_user_id_idx" ON "user_exam_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_interests_user_id_idx" ON "user_interests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_learning_goals_user_id_idx" ON "user_learning_goals" USING btree ("user_id");