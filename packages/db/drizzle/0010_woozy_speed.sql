ALTER TABLE "practice_passages" ADD COLUMN "passage_text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_passages" DROP COLUMN "passage_type";--> statement-breakpoint
ALTER TABLE "practice_passages" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "practice_passages" DROP COLUMN "vocabulary";