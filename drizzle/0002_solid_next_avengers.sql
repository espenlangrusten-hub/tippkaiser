CREATE TABLE "tippkaiser"."finn_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"puzzle_id" text NOT NULL,
	"user_id" text,
	"hint_number" integer DEFAULT 1 NOT NULL,
	"finished" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tippkaiser"."game_progress" (
	"user_id" text NOT NULL,
	"puzzle_id" text NOT NULL,
	"game" text NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_progress_user_id_puzzle_id_pk" PRIMARY KEY("user_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "tippkaiser"."league_results" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"puzzle_id" text NOT NULL,
	"game" text NOT NULL,
	"date" text NOT NULL,
	"raw_score" integer NOT NULL,
	"league_points" integer NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tippkaiser"."sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tippkaiser"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"username_normalized" text NOT NULL,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tippkaiser"."finn_attempts" ADD CONSTRAINT "finn_attempts_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "tippkaiser"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tippkaiser"."finn_attempts" ADD CONSTRAINT "finn_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "tippkaiser"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tippkaiser"."game_progress" ADD CONSTRAINT "game_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "tippkaiser"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tippkaiser"."game_progress" ADD CONSTRAINT "game_progress_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "tippkaiser"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tippkaiser"."league_results" ADD CONSTRAINT "league_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "tippkaiser"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tippkaiser"."league_results" ADD CONSTRAINT "league_results_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "tippkaiser"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tippkaiser"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "tippkaiser"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finn_attempts_puzzle" ON "tippkaiser"."finn_attempts" USING btree ("puzzle_id");--> statement-breakpoint
CREATE INDEX "finn_attempts_user" ON "tippkaiser"."finn_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "league_results_user_puzzle" ON "tippkaiser"."league_results" USING btree ("user_id","puzzle_id");--> statement-breakpoint
CREATE INDEX "league_results_date" ON "tippkaiser"."league_results" USING btree ("date");--> statement-breakpoint
CREATE INDEX "league_results_user_date" ON "tippkaiser"."league_results" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "sessions_user" ON "tippkaiser"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry" ON "tippkaiser"."sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_normalized" ON "tippkaiser"."users" USING btree ("username_normalized");