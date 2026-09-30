CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(254) NOT NULL,
	"message" varchar(5000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(120) NOT NULL,
	"short_description" varchar(300) NOT NULL,
	"description" text NOT NULL,
	"tech_stack" text[] DEFAULT '{}' NOT NULL,
	"thumbnail_url" text,
	"project_url" text,
	"repo_url" text,
	"sign_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "projects_sign_order_idx" ON "projects" USING btree ("sign_order");