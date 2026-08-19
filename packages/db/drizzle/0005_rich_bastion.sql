CREATE TABLE "user_vocabulary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"word" varchar(100) NOT NULL,
	"meaning" text,
	"example_sentence" text,
	"notes" text,
	"tags" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_vocabulary_user_word_unique" UNIQUE("user_id","word")
);
--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_vocabulary_user_id_idx" ON "user_vocabulary" USING btree ("user_id");