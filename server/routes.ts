import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertCourseSchema,
  updateCourseSchema,
  insertModuleSchema,
  insertUserProgressSchema,
  insertMessageSchema,
  insertCommentSchema,
  insertSettingSchema,
  insertToolSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== Authentication Routes =====
  app.post("/api/auth/send-code", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    // In a real app, you'd send an email here. For demo, we always return success
    res.json({ success: true });
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // Demo code is always 1234
    if (code !== "1234") {
      return res.status(401).json({ error: "Invalid code" });
    }

    // Get or create user
    let user = await storage.getUserByEmail(email);
    if (!user) {
      // Create new user
      const role = email === "david@davidwang.com.au" ? "admin" : "student";
      user = await storage.createUser({
        email,
        name: email.split("@")[0],
        role,
      });
    }

    res.json({ user });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  });

  // Get admin user for messaging
  app.get("/api/users/admin", async (req, res) => {
    const admin = await storage.getAdminUser();
    if (!admin) {
      return res.status(404).json({ error: "Admin user not found" });
    }
    res.json({ user: admin });
  });

  // ===== Course Routes =====
  app.get("/api/courses", async (req, res) => {
    const courses = await storage.getCourses();
    
    // Include modules for each course
    const coursesWithModules = await Promise.all(
      courses.map(async (course) => {
        const modules = await storage.getModulesByCourse(course.id);
        return { ...course, modules };
      })
    );
    
    res.json({ courses: coursesWithModules });
  });

  app.get("/api/courses/:id", async (req, res) => {
    const course = await storage.getCourse(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const modules = await storage.getModulesByCourse(req.params.id);
    res.json({ course, modules });
  });

  app.post("/api/courses", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const parsed = insertCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const course = await storage.createCourse(parsed.data);
    res.json({ course });
  });

  app.patch("/api/courses/:id", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Filter out fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, modules, ...rawUpdateData } = req.body;
    
    // Validate update data with Zod schema
    const parseResult = updateCourseSchema.safeParse(rawUpdateData);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid update data", details: parseResult.error.format() });
    }

    const course = await storage.updateCourse(req.params.id, parseResult.data);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ course });
  });

  app.delete("/api/courses/:id", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await storage.deleteCourse(req.params.id);
    res.json({ success: true });
  });

  // Batch reorder courses (atomic stage normalization)
  app.post("/api/courses/reorder", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { courseIds } = req.body;
    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ error: "courseIds must be an array" });
    }

    // Update all courses with normalized stages (1, 2, 3, ...)
    await storage.reorderCourses(courseIds);
    res.json({ success: true });
  });

  // ===== Module Routes =====
  app.post("/api/modules", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const parsed = insertModuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const module = await storage.createModule(parsed.data);
    res.json({ module });
  });

  app.patch("/api/modules/:id", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const module = await storage.updateModule(req.params.id, req.body);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json({ module });
  });

  app.delete("/api/modules/:id", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await storage.deleteModule(req.params.id);
    res.json({ success: true });
  });

  // ===== Progress Routes =====
  app.get("/api/progress", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const progress = await storage.getUserProgress(userId);
    res.json({ progress });
  });

  app.post("/api/progress", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Convert completedAt string to Date if needed
    const body = { ...req.body, userId };
    if (body.completedAt && typeof body.completedAt === 'string') {
      body.completedAt = new Date(body.completedAt);
    }

    const parsed = insertUserProgressSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const progress = await storage.createOrUpdateProgress(parsed.data);
    
    // Update streak when a module is completed
    let streakData = null;
    if (parsed.data.isCompleted) {
      streakData = await storage.updateStreak(userId);
    }
    
    res.json({ progress, streak: streakData });
  });

  // Get user streak
  app.get("/api/streak", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const streak = await storage.getUserStreak(userId);
    res.json(streak);
  });

  // Track module access for resume functionality
  app.post("/api/progress/track-access", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { moduleId } = req.body;
    if (!moduleId) {
      return res.status(400).json({ error: "moduleId is required" });
    }

    await storage.trackModuleAccess(userId, moduleId);
    res.json({ success: true });
  });

  // Get last accessed module for resume functionality
  app.get("/api/progress/last-accessed", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const lastAccessed = await storage.getLastAccessedModule(userId);
    res.json({ lastAccessed });
  });

  // Get recently accessed courses for roadmap section
  app.get("/api/progress/recent-courses", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const limit = parseInt(req.query.limit as string) || 3;
    const courseIds = await storage.getRecentlyAccessedCourses(userId, limit);
    res.json({ courseIds });
  });

  // ===== Course Unlock Routes =====
  app.get("/api/unlocks", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const unlocks = await storage.getUserUnlocks(userId);
    res.json({ unlocks });
  });

  app.get("/api/unlocks/:courseId", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isUnlocked = await storage.hasUnlockedCourse(userId, req.params.courseId);
    res.json({ isUnlocked });
  });

  app.post("/api/unlocks/:courseId", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const unlock = await storage.unlockCourse(userId, req.params.courseId);
    res.json({ unlock });
  });

  // ===== Message Routes =====
  app.get("/api/messages", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const messages = await storage.getMessagesForUser(userId);
    
    // Get unique conversation partners
    const partnerIds = new Set<string>();
    messages.forEach(msg => {
      if (msg.senderId !== userId) partnerIds.add(msg.senderId);
      if (msg.recipientId !== userId) partnerIds.add(msg.recipientId);
    });

    // Fetch user details for partners
    const partners = await Promise.all(
      Array.from(partnerIds).map(id => storage.getUser(id))
    );

    res.json({ messages, partners: partners.filter(p => p !== undefined) });
  });

  app.get("/api/messages/:topicId", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const topicId = req.params.topicId;
    
    // Fetch the topic (root message)
    const rootMessage = await storage.getMessage(topicId);
    if (!rootMessage) {
      return res.status(404).json({ error: "Topic not found" });
    }
    
    // Fetch all messages in this topic
    const messages = await storage.getMessagesByTopic(topicId);
    
    // Determine the partner (the other person)
    const partnerId = rootMessage.senderId === userId ? rootMessage.recipientId : rootMessage.senderId;
    const partner = await storage.getUser(partnerId);

    // Mark messages as read for the current user
    for (const msg of messages) {
      if (msg.recipientId === userId && !msg.isRead) {
        await storage.markMessageAsRead(msg.id);
      }
    }
    
    // Get topic info from root message
    const topic = {
      id: topicId,
      subject: (rootMessage as any).subject || "General Inquiry",
      status: (rootMessage as any).status || "open",
    };

    res.json({ messages, partner, topic });
  });

  app.patch("/api/messages/:topicId/status", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { status } = req.body;
    if (status !== "open" && status !== "resolved") {
      return res.status(400).json({ error: "Invalid status" });
    }

    await storage.updateMessageStatus(req.params.topicId, status);
    res.json({ success: true });
  });

  app.post("/api/messages", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const parsed = insertMessageSchema.safeParse({ ...req.body, senderId: userId });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const message = await storage.createMessage(parsed.data);
    res.json({ message });
  });

  // ===== Comment Routes =====
  app.get("/api/comments/:courseId", async (req, res) => {
    const comments = await storage.getCommentsByCourse(req.params.courseId);
    
    // Fetch user details for commenters
    const userIds = Array.from(new Set(comments.map(c => c.userId)));
    const users = await Promise.all(userIds.map(id => storage.getUser(id)));
    const userMap = Object.fromEntries(users.filter(u => u).map(u => [u!.id, u!]));

    res.json({ comments, users: userMap });
  });

  app.post("/api/comments", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const parsed = insertCommentSchema.safeParse({ ...req.body, userId });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const comment = await storage.createComment(parsed.data);
    const user = await storage.getUser(userId);

    res.json({ comment, user });
  });

  // ===== Settings Routes =====
  app.get("/api/settings/:key", async (req, res) => {
    const setting = await storage.getSetting(req.params.key);
    res.json({ setting });
  });

  app.post("/api/settings", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const parsed = insertSettingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const setting = await storage.updateSetting(parsed.data);
    res.json({ setting });
  });

  // ===== ChatKit Session Creation (for workflow-based chat) =====
  app.post("/api/chatkit/session", async (req, res) => {
    const { userId, assessmentType } = req.body;
    
    // ChatKit sessions require OPENAI_API_KEY (not domain_pk - that's for domain verification)
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(503).json({ error: "AI service not configured. Please add OPENAI_API_KEY secret." });
    }

    // OpenAI Agent Builder workflow ID
    const workflowId = "wf_692f8a8ba8348190be3357fa942194fb0c72976197e11330";
    
    // Encode assessment type in user field (ChatKit API limitation - no custom context allowed)
    // Format: userId_assessmentType (e.g., "user123_quick_quiz")
    const userWithContext = `${userId || "anonymous"}_${assessmentType || "general_question"}`;
    
    console.log("=== ChatKit Session Creation ===");
    console.log("Received userId:", userId);
    console.log("Received assessmentType:", assessmentType);
    console.log("Combined user field:", userWithContext);
    console.log("Workflow ID:", workflowId);

    try {
      const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "OpenAI-Beta": "chatkit_beta=v1",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          workflow: { id: workflowId },
          user: userWithContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("ChatKit session error:", response.status, errorData);
        return res.status(response.status).json({ error: "Failed to create chat session." });
      }

      const data = await response.json();
      res.json({ client_secret: data.client_secret, session_id: data.id });
    } catch (error) {
      console.error("ChatKit session error:", error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  // ===== Luma Events Route =====
  app.get("/api/events", async (req, res) => {
    try {
      const lumaCalendarId = await storage.getSetting("luma_calendar_id");
      
      if (!lumaCalendarId?.value) {
        return res.status(503).json({ 
          error: "Events not configured. Admin needs to set up Luma calendar ID in settings." 
        });
      }

      const lumaApiKey = process.env.LUMA_API_KEY;
      if (!lumaApiKey) {
        return res.status(503).json({ 
          error: "Luma API key not configured. Please add LUMA_API_KEY secret." 
        });
      }

      const response = await fetch(
        `https://api.lu.ma/public/v1/calendar/list-events?calendar_api_id=${lumaCalendarId.value}`,
        {
          headers: {
            "accept": "application/json",
            "x-luma-api-key": lumaApiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Luma API error:", response.status, errorText);
        return res.status(response.status).json({ 
          error: "Failed to fetch events from Luma" 
        });
      }

      const data = await response.json();
      
      const events = (data.entries || []).map((entry: any) => ({
        id: entry.event?.api_id || entry.api_id,
        name: entry.event?.name || "Untitled Event",
        description: entry.event?.description || "",
        start_at: entry.event?.start_at,
        end_at: entry.event?.end_at,
        cover_url: entry.event?.cover_url,
        url: entry.event?.url || `https://lu.ma/${entry.event?.api_id}`,
        geo_address_info: entry.event?.geo_address_info,
        timezone: entry.event?.timezone || "UTC",
      }));

      res.json({ events });
    } catch (error) {
      console.error("Events fetch error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // ===== AI Test Route (OpenAI Responses API fallback) =====
  app.post("/api/chat", async (req, res) => {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Use the OPENAI_API_KEY environment variable for Responses API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "AI service not configured. Please add OPENAI_API_KEY secret." });
    }

    try {
      // Build the request body for OpenAI Responses API
      const requestBody: Record<string, unknown> = {
        model: "gpt-4o",
        input: message,
        instructions: "You are a Product Management skill assessment tool for Product Academy. Your role is to test users on PM concepts based on Dave's framework from 'Anyone Can Be a PM'. Ask questions about product strategy, user research, OKRs, roadmapping, stakeholder management, and PM interview skills. Provide feedback on their answers and help them improve their PM knowledge.",
      };

      // Add previous response ID for multi-turn conversation continuity
      if (conversationHistory?.lastResponseId) {
        requestBody.previous_response_id = conversationHistory.lastResponseId;
      }

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenAI Responses API error:", response.status, errorData);
        return res.status(response.status).json({ error: "AI service error. Please try again." });
      }

      const data = await response.json();
      
      // Extract the reply using the output_text convenience field
      // This is the concatenated text from all output messages
      let reply = "Sorry, I couldn't generate a response.";
      const responseId = data.id || null;
      
      // The Responses API provides output_text as a convenience field
      if (data.output_text && typeof data.output_text === "string") {
        reply = data.output_text;
      } else if (Array.isArray(data.output)) {
        // Fallback: manually extract text from output array
        const textParts: string[] = [];
        for (const item of data.output) {
          if (item.type === "message" && Array.isArray(item.content)) {
            for (const content of item.content) {
              if (content.type === "output_text" && content.text) {
                textParts.push(content.text);
              }
            }
          }
        }
        if (textParts.length > 0) {
          reply = textParts.join("\n");
        }
      }

      res.json({ reply, responseId });
    } catch (error) {
      console.error("AI Test error:", error);
      res.status(500).json({ error: "Failed to process AI request" });
    }
  });

  // ===== Tools Routes =====
  app.get("/api/tools", async (req, res) => {
    const tools = await storage.getTools();
    res.json({ tools });
  });

  app.get("/api/tools/:id", async (req, res) => {
    const tool = await storage.getTool(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }
    res.json({ tool });
  });

  app.post("/api/tools", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const parsed = insertToolSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const tool = await storage.createTool(parsed.data);
    res.json({ tool });
  });

  app.patch("/api/tools/:id", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const tool = await storage.updateTool(req.params.id, req.body);
    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }

    res.json({ tool });
  });

  app.delete("/api/tools/:id", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await storage.deleteTool(req.params.id);
    res.json({ success: true });
  });

  return httpServer;
}
