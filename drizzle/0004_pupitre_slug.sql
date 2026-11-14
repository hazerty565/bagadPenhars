ALTER TABLE "pupitres" ADD COLUMN "slug" varchar(50) NOT NULL;--> statement-breakpoint
CREATE INDEX "pupitres_slug_idx" ON "pupitres" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "pupitres" ADD CONSTRAINT "pupitres_slug_unique" UNIQUE("slug");