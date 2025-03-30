import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const roleEnum = pgEnum('role', ['student', 'teacher', 'admin']);

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default('student'),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
});

// Course schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  durationHours: integer("duration_hours").notNull(),
  instructorId: integer("instructor_id").notNull(),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  level: true,
  durationHours: true,
  instructorId: true,
  coverImage: true,
});

// Enrollment schema - relates users to courses
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").notNull().default(0),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  userId: true,
  courseId: true,
  progress: true,
});

// Note schema
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
  userId: true,
  tags: true,
});

// Coding problems schema
export const codingProblems = pgTable("coding_problems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  tags: text("tags").array(),
  testCases: json("test_cases").notNull(),
  boilerplateCode: json("boilerplate_code"),
  solutionCode: json("solution_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCodingProblemSchema = createInsertSchema(codingProblems).pick({
  title: true,
  description: true,
  difficulty: true,
  tags: true,
  testCases: true,
  boilerplateCode: true,
  solutionCode: true,
});

// Interview schema
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  isAi: boolean("is_ai").notNull().default(true),
  scheduledAt: timestamp("scheduled_at").notNull(),
  difficulty: text("difficulty").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviews).pick({
  userId: true,
  type: true,
  isAi: true,
  scheduledAt: true,
  difficulty: true,
  notes: true,
});

// Test/Quiz schema
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // MCQ, coding, mixed
  durationMinutes: integer("duration_minutes").notNull(),
  questions: json("questions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledAt: timestamp("scheduled_at"),
});

export const insertTestSchema = createInsertSchema(tests).pick({
  title: true,
  description: true,
  type: true,
  durationMinutes: true,
  questions: true,
  scheduledAt: true,
});

// User stats schema
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  learningHours: integer("learning_hours").notNull().default(0),
  problemsSolved: integer("problems_solved").notNull().default(0),
  testsCompleted: integer("tests_completed").notNull().default(0),
  interviewsCompleted: integer("interviews_completed").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  learningHours: true,
  problemsSolved: true,
  testsCompleted: true,
  interviewsCompleted: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export type InsertCodingProblem = z.infer<typeof insertCodingProblemSchema>;
export type CodingProblem = typeof codingProblems.$inferSelect;

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;
