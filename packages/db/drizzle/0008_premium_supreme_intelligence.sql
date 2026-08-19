CREATE TABLE "practice_passages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam" "practice_exam" NOT NULL,
	"part" varchar(20) NOT NULL,
	"passage_type" varchar(30),
	"title" varchar(255),
	"content" text NOT NULL,
	"difficulty" varchar(30),
	"vocabulary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_questions" ADD COLUMN "passage_id" uuid;--> statement-breakpoint
ALTER TABLE "practice_questions" ADD COLUMN "passage_question_number" integer;--> statement-breakpoint
CREATE INDEX "practice_passages_exam_part_idx" ON "practice_passages" USING btree ("exam","part");--> statement-breakpoint
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_passage_id_practice_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."practice_passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_questions_passage_id_idx" ON "practice_questions" USING btree ("passage_id");