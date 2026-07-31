import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accountProfiles = sqliteTable("account_profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["candidate", "recruiter"] }).notNull(),
  professionalTitle: text("professional_title").notNull().default(""),
  experienceYears: integer("experience_years").notNull().default(0),
  location: text("location").notNull().default(""),
  githubUsername: text("github_username").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
