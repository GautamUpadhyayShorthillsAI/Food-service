CREATE TYPE "public"."booking_status" AS ENUM('Booked', 'Cancelled', 'Attended');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('Breakfast', 'Lunch', 'Dinner');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('User', 'Admin');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"num_people" integer NOT NULL,
	"status" "booking_status" DEFAULT 'Booked' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_num_people_check" CHECK ("bookings"."num_people" > 0)
);
--> statement-breakpoint
CREATE TABLE "daily_menu" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"dishes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"dishes" jsonb NOT NULL,
	"is_default" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" "role" DEFAULT 'User' NOT NULL,
	"otp_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_date_idx" ON "bookings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "bookings_user_date_meal_idx" ON "bookings" USING btree ("user_id","date","meal_type");--> statement-breakpoint
CREATE INDEX "daily_menu_date_meal_idx" ON "daily_menu" USING btree ("date","meal_type");--> statement-breakpoint
CREATE INDEX "menu_day_meal_idx" ON "menu" USING btree ("day_of_week","meal_type");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");