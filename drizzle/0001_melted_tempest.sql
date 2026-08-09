CREATE TABLE "store_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(120) DEFAULT 'Fresh Mart' NOT NULL,
	"name_ar" varchar(120),
	"logo_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "name_ar" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "name_ar" varchar(200);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description_ar" text;