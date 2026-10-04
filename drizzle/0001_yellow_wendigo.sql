CREATE INDEX "appearances_player" ON "tippkaiser"."appearances" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "goals_player" ON "tippkaiser"."goals" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "honours_club" ON "tippkaiser"."honours" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "honours_player" ON "tippkaiser"."honours" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "matches_competition" ON "tippkaiser"."matches" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "schedule_puzzle" ON "tippkaiser"."schedule" USING btree ("puzzle_id");--> statement-breakpoint
CREATE INDEX "season_entries_club" ON "tippkaiser"."season_entries" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "seasons_competition" ON "tippkaiser"."seasons" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "squad_members_player" ON "tippkaiser"."squad_members" USING btree ("player_id");