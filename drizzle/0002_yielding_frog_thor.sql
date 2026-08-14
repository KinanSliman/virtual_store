CREATE TABLE "images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"extension" varchar(8) NOT NULL,
	"content_type" varchar(60) NOT NULL,
	"data" "bytea" NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
