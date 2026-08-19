CREATE TYPE "public"."practice_exam" AS ENUM('toeic', 'eiken');--> statement-breakpoint
CREATE TYPE "public"."practice_question_type" AS ENUM('multiple_choice');--> statement-breakpoint
CREATE TABLE "practice_question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_label" varchar(1) NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_question_options_unique" UNIQUE("question_id","option_label")
);
--> statement-breakpoint
CREATE TABLE "practice_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam" "practice_exam" NOT NULL,
	"part" varchar(20) NOT NULL,
	"question_type" "practice_question_type" DEFAULT 'multiple_choice' NOT NULL,
	"question_text" text NOT NULL,
	"explanation" text,
	"difficulty" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_question_options" ADD CONSTRAINT "practice_question_options_question_id_practice_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."practice_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_question_options_question_id_idx" ON "practice_question_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "practice_questions_exam_part_idx" ON "practice_questions" USING btree ("exam","part");