import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  role: text("role", { enum: ["admin", "student"] }).notNull().default("student"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructor: text("instructor").notNull(),
  thumbnail: text("thumbnail").notNull(),
  stage: integer("stage"),
  roadmapHeading: text("roadmap_heading"),
  roadmapSubheading: text("roadmap_subheading"),
  rating: text("rating"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Modules table
export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  duration: text("duration").notNull(),
  videoId: text("video_id").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

// User progress table
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// User course unlocks table
export const userUnlocks = pgTable("user_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const insertUserUnlockSchema = createInsertSchema(userUnlocks).omit({
  id: true,
  unlockedAt: true,
});

export type InsertUserUnlock = z.infer<typeof insertUserUnlockSchema>;
export type UserUnlock = typeof userUnlocks.$inferSelect;

// Messages table (topics/tickets)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject"), // Topic title (only set on first message of a topic)
  text: text("text").notNull(),
  topicId: varchar("topic_id"), // Groups related messages together (null = new topic, otherwise references the original message id)
  status: text("status").notNull().default("open"), // "open" or "resolved"
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Settings table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Tools table (PM templates, frameworks, resources)
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "Assessment", "Planning", "Templates"
  linkType: text("link_type").notNull(), // e.g., "Google Doc", "Google Sheet", "Notion", "External"
  url: text("url").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
});

export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;

// Relations
export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  comments: many(comments),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  userProgress: many(userProgress),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  userProgress: many(userProgress),
  comments: many(comments),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  module: one(modules, {
    fields: [userProgress.moduleId],
    references: [modules.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  course: one(courses, {
    fields: [comments.courseId],
    references: [courses.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));
