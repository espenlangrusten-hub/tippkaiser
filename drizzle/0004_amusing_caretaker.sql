ALTER TABLE "tippkaiser"."finn_attempts" ADD COLUMN "result" jsonb;
--> statement-breakpoint
ALTER TABLE tippkaiser.users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tippkaiser.sessions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tippkaiser.game_progress ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tippkaiser.league_results ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tippkaiser.finn_attempts ENABLE ROW LEVEL SECURITY;
