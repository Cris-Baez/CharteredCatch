CREATE TABLE "availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"charter_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"slots" integer DEFAULT 1 NOT NULL,
	"booked_slots" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"charter_id" integer NOT NULL,
	"trip_date" timestamp NOT NULL,
	"guests" integer NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "captains" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"bio" text NOT NULL,
	"experience" text NOT NULL,
	"license_number" text NOT NULL,
	"location" text NOT NULL,
	"avatar" text,
	"verified" boolean DEFAULT false,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"review_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "charters" (
	"id" serial PRIMARY KEY NOT NULL,
	"captain_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"target_species" text NOT NULL,
	"duration" text NOT NULL,
	"max_guests" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"boat_specs" text,
	"included" text,
	"images" text[],
	"available" boolean DEFAULT true,
	"is_listed" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"charter_id" integer,
	"content" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"captain_id" integer NOT NULL,
	"charter_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"password" text NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_charter_id_charters_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_charter_id_charters_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captains" ADD CONSTRAINT "captains_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charters" ADD CONSTRAINT "charters_captain_id_captains_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."captains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_charter_id_charters_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_captain_id_captains_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."captains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_charter_id_charters_id_fk" FOREIGN KEY ("charter_id") REFERENCES "public"."charters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_availability_charter_date" ON "availability" USING btree ("charter_id","date");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");