import {
  users,
  courses,
  modules,
  userProgress,
  userUnlocks,
  messages,
  comments,
  settings,
  tools,
  type User,
  type InsertUser,
  type Course,
  type InsertCourse,
  type Module,
  type InsertModule,
  type UserProgress,
  type InsertUserProgress,
  type UserUnlock,
  type InsertUserUnlock,
  type Message,
  type InsertMessage,
  type Comment,
  type InsertComment,
  type Setting,
  type InsertSetting,
  type Tool,
  type InsertTool,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAdminUser(): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  reorderCourses(courseIds: string[]): Promise<void>;
  
  // Modules
  getModulesByCourse(courseId: string): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, module: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: string): Promise<void>;
  deleteModulesByCourse(courseId: string): Promise<void>;
  
  // User Progress
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getModuleProgress(userId: string, moduleId: string): Promise<UserProgress | undefined>;
  createOrUpdateProgress(progress: InsertUserProgress): Promise<UserProgress>;
  trackModuleAccess(userId: string, moduleId: string): Promise<void>;
  getLastAccessedModule(userId: string): Promise<{ moduleId: string; courseId: string } | null>;
  getRecentlyAccessedCourses(userId: string, limit?: number): Promise<string[]>;
  
  // Streaks
  updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; streakIncreased: boolean }>;
  getUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; lastActivityDate: Date | null }>;
  
  // User Unlocks
  getUserUnlocks(userId: string): Promise<UserUnlock[]>;
  hasUnlockedCourse(userId: string, courseId: string): Promise<boolean>;
  unlockCourse(userId: string, courseId: string): Promise<UserUnlock>;
  
  // Messages
  getMessagesForUser(userId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByTopic(topicId: string): Promise<Message[]>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;
  markMessageAsRead(messageId: string): Promise<void>;
  updateMessageStatus(topicId: string, status: "open" | "resolved"): Promise<void>;
  
  // Comments
  getCommentsByCourse(courseId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(setting: InsertSetting): Promise<Setting>;
  
  // Tools
  getTools(): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAdminUser(): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.role, "admin"));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.stage);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourse(id: string, updateData: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db
      .update(courses)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course || undefined;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async reorderCourses(courseIds: string[]): Promise<void> {
    // Use transaction for atomic stage normalization
    await db.transaction(async (tx) => {
      for (let i = 0; i < courseIds.length; i++) {
        await tx
          .update(courses)
          .set({ stage: i + 1, updatedAt: new Date() })
          .where(eq(courses.id, courseIds[i]));
      }
    });
  }

  // Modules
  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return await db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(modules.order);
  }

  async getModule(id: string): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module || undefined;
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const [module] = await db.insert(modules).values(insertModule).returning();
    return module;
  }

  async updateModule(id: string, updateData: Partial<InsertModule>): Promise<Module | undefined> {
    const [module] = await db
      .update(modules)
      .set(updateData)
      .where(eq(modules.id, id))
      .returning();
    return module || undefined;
  }

  async deleteModule(id: string): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  async deleteModulesByCourse(courseId: string): Promise<void> {
    await db.delete(modules).where(eq(modules.courseId, courseId));
  }

  // User Progress
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getModuleProgress(userId: string, moduleId: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.moduleId, moduleId)));
    return progress || undefined;
  }

  async createOrUpdateProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getModuleProgress(insertProgress.userId, insertProgress.moduleId);
    
    if (existing) {
      const [progress] = await db
        .update(userProgress)
        .set({ isCompleted: insertProgress.isCompleted, completedAt: insertProgress.completedAt })
        .where(eq(userProgress.id, existing.id))
        .returning();
      return progress;
    } else {
      const [progress] = await db.insert(userProgress).values(insertProgress).returning();
      return progress;
    }
  }

  async trackModuleAccess(userId: string, moduleId: string): Promise<void> {
    const existing = await this.getModuleProgress(userId, moduleId);
    
    if (existing) {
      await db
        .update(userProgress)
        .set({ lastAccessedAt: new Date() })
        .where(eq(userProgress.id, existing.id));
    } else {
      await db.insert(userProgress).values({
        userId,
        moduleId,
        isCompleted: false,
        lastAccessedAt: new Date(),
      });
    }
  }

  async getLastAccessedModule(userId: string): Promise<{ moduleId: string; courseId: string } | null> {
    const result = await db
      .select({
        moduleId: userProgress.moduleId,
        courseId: modules.courseId,
        lastAccessedAt: userProgress.lastAccessedAt,
      })
      .from(userProgress)
      .innerJoin(modules, eq(userProgress.moduleId, modules.id))
      .where(and(
        eq(userProgress.userId, userId),
        sql`${userProgress.lastAccessedAt} IS NOT NULL`
      ))
      .orderBy(sql`${userProgress.lastAccessedAt} DESC`)
      .limit(1);
    
    if (result.length > 0) {
      return { moduleId: result[0].moduleId, courseId: result[0].courseId };
    }
    return null;
  }

  async getRecentlyAccessedCourses(userId: string, limit: number = 3): Promise<string[]> {
    const result = await db
      .selectDistinct({
        courseId: modules.courseId,
        lastAccessedAt: sql<Date>`MAX(${userProgress.lastAccessedAt})`.as('max_accessed'),
      })
      .from(userProgress)
      .innerJoin(modules, eq(userProgress.moduleId, modules.id))
      .where(and(
        eq(userProgress.userId, userId),
        sql`${userProgress.lastAccessedAt} IS NOT NULL`
      ))
      .groupBy(modules.courseId)
      .orderBy(sql`MAX(${userProgress.lastAccessedAt}) DESC`)
      .limit(limit);
    
    return result.map(r => r.courseId);
  }

  // User Unlocks
  async getUserUnlocks(userId: string): Promise<UserUnlock[]> {
    return await db
      .select()
      .from(userUnlocks)
      .where(eq(userUnlocks.userId, userId));
  }

  async hasUnlockedCourse(userId: string, courseId: string): Promise<boolean> {
    const [unlock] = await db
      .select()
      .from(userUnlocks)
      .where(and(eq(userUnlocks.userId, userId), eq(userUnlocks.courseId, courseId)));
    return !!unlock;
  }

  async unlockCourse(userId: string, courseId: string): Promise<UserUnlock> {
    // Check if already unlocked
    const existing = await this.hasUnlockedCourse(userId, courseId);
    if (existing) {
      const [unlock] = await db
        .select()
        .from(userUnlocks)
        .where(and(eq(userUnlocks.userId, userId), eq(userUnlocks.courseId, courseId)));
      return unlock;
    }
    // Create new unlock
    const [unlock] = await db.insert(userUnlocks).values({ userId, courseId }).returning();
    return unlock;
  }

  // Streaks
  async getUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; lastActivityDate: Date | null }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    }
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
    };
  }

  async updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; streakIncreased: boolean }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { currentStreak: 0, longestStreak: 0, streakIncreased: false };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = user.lastActivityDate 
      ? new Date(user.lastActivityDate.getFullYear(), user.lastActivityDate.getMonth(), user.lastActivityDate.getDate())
      : null;

    let newStreak = user.currentStreak;
    let streakIncreased = false;

    if (!lastActivity) {
      // First activity ever
      newStreak = 1;
      streakIncreased = true;
    } else {
      const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, streak stays the same
        return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, streakIncreased: false };
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreak = user.currentStreak + 1;
        streakIncreased = true;
      } else {
        // Streak broken, start fresh
        newStreak = 1;
        streakIncreased = true; // New streak started
      }
    }

    const newLongestStreak = Math.max(newStreak, user.longestStreak);

    await db
      .update(users)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: now,
      })
      .where(eq(users.id, userId));

    return { currentStreak: newStreak, longestStreak: newLongestStreak, streakIncreased };
  }

  // Messages
  async getMessagesForUser(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.recipientId, userId), eq(messages.senderId, senderId)));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesByTopic(topicId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.id, topicId), eq(messages.topicId, topicId)))
      .orderBy(messages.createdAt);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async updateMessageStatus(topicId: string, status: "open" | "resolved"): Promise<void> {
    await db
      .update(messages)
      .set({ status })
      .where(eq(messages.id, topicId));
  }

  // Comments
  async getCommentsByCourse(courseId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.courseId, courseId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async updateSetting(insertSetting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(insertSetting.key);
    
    if (existing) {
      const [setting] = await db
        .update(settings)
        .set({ value: insertSetting.value, updatedAt: new Date() })
        .where(eq(settings.key, insertSetting.key))
        .returning();
      return setting;
    } else {
      const [setting] = await db.insert(settings).values(insertSetting).returning();
      return setting;
    }
  }

  async seedIfEmpty(): Promise<void> {
    const existingCourses = await this.getCourses();
    if (existingCourses.length > 0) {
      console.log("Database already has courses, skipping seed");
      return;
    }

    console.log("Seeding initial courses...");
    
    const course1 = await this.createCourse({
      title: "Anyone Can Be a Product Manager (with AI)",
      description: `
        <h3>Learn the Core Skills of a Professional PM in 4 Weeks with AI</h3>
        <p>I will help you find a fulfilling career in Product Management without wasting thousands for certificates that hiring managers ignore.</p>
        <br/>
        <p><strong>This course covers:</strong></p>
        <ul>
          <li>The Product Function and the Role of a Product Manager</li>
          <li>The End-to-End Product Management Process</li>
          <li>How to Manage Product Ideas</li>
          <li>How to Set Up Objectives and Metrics</li>
          <li>Turning Research Insights Into Product Features</li>
        </ul>
      `,
      instructor: "Product Dave",
      thumbnail: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/e50a15e-0efe-0d2e-4153-0564e10bd56b_vlcsnap-2025-03-16-10h57m38s900.png",
      stage: 1,
      isLocked: false,
    });

    await this.createModule({
      courseId: course1.id,
      title: "Topic #1: The Product Function & Role",
      duration: "1:06",
      videoId: "ItxSH-f1Ur8",
      order: 0,
    });
    await this.createModule({
      courseId: course1.id,
      title: "Topic #2: The End-to-End PM Process",
      duration: "15:30",
      videoId: "LXb3EKWsInQ",
      order: 1,
    });
    await this.createModule({
      courseId: course1.id,
      title: "Topic #3: Managing Product Ideas",
      duration: "12:45",
      videoId: "ysz5S6PUM-U",
      order: 2,
    });
    await this.createModule({
      courseId: course1.id,
      title: "Topic #4: Objectives & Metrics (OKRs)",
      duration: "20:10",
      videoId: "9xwazD5SyVg",
      order: 3,
    });
    await this.createModule({
      courseId: course1.id,
      title: "Topic #5: Mapping Product Assumptions",
      duration: "14:20",
      videoId: "LXb3EKWsInQ",
      order: 4,
    });

    const course2 = await this.createCourse({
      title: "Break into PM BlueStrategy",
      description: "Your strategic roadmap to landing that first Product Management role.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
      stage: 2,
      isLocked: false,
    });

    await this.createModule({
      courseId: course2.id,
      title: "Finding Your Product Journey",
      duration: "08:15",
      videoId: "ysz5S6PUM-U",
      order: 1,
    });
    await this.createModule({
      courseId: course2.id,
      title: "Resume & Interview Prep",
      duration: "18:20",
      videoId: "LXb3EKWsInQ",
      order: 2,
    });

    await this.createCourse({
      title: "Advanced Product Strategy",
      description: "Master the art of product strategy and vision.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1553877607-422830722365?w=800&auto=format&fit=crop&q=60",
      stage: 3,
      isLocked: true,
    });

    await this.createCourse({
      title: "Leadership & Stakeholder Management",
      description: "Learn to influence without authority.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60",
      stage: 4,
      isLocked: true,
    });

    await this.createCourse({
      title: "Product Executive Masterclass",
      description: "Scaling product organizations and culture.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=60",
      stage: 5,
      isLocked: true,
    });

    console.log("Initial courses seeded successfully!");
  }

  // Tools
  async getTools(): Promise<Tool[]> {
    return await db.select().from(tools).orderBy(tools.order);
  }

  async getTool(id: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool || undefined;
  }

  async createTool(insertTool: InsertTool): Promise<Tool> {
    const [tool] = await db.insert(tools).values(insertTool).returning();
    return tool;
  }

  async updateTool(id: string, updateData: Partial<InsertTool>): Promise<Tool | undefined> {
    const [tool] = await db
      .update(tools)
      .set(updateData)
      .where(eq(tools.id, id))
      .returning();
    return tool || undefined;
  }

  async deleteTool(id: string): Promise<void> {
    await db.delete(tools).where(eq(tools.id, id));
  }
}

export const storage = new DatabaseStorage();
