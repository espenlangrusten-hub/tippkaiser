CREATE TABLE "tippkaiser"."genius_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"puzzle_id" text NOT NULL,
	"user_id" text,
	"state" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tippkaiser"."genius_attempts" ADD CONSTRAINT "genius_attempts_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "tippkaiser"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tippkaiser"."genius_attempts" ADD CONSTRAINT "genius_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "tippkaiser"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "genius_attempts_user_puzzle" ON "tippkaiser"."genius_attempts" USING btree ("user_id","puzzle_id");--> statement-breakpoint
CREATE INDEX "genius_attempts_puzzle" ON "tippkaiser"."genius_attempts" USING btree ("puzzle_id");--> statement-breakpoint
ALTER TABLE "tippkaiser"."genius_attempts" ENABLE ROW LEVEL SECURITY;
