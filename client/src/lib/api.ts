// API client for Product Academy
const API_BASE = "/api";

// Helper to get user ID from localStorage
function getUserId(): string | null {
  return localStorage.getItem("userId");
}

// Helper to set headers with authentication
function getHeaders(): HeadersInit {
  const userId = getUserId();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (userId) {
    headers["x-user-id"] = userId;
  }
  return headers;
}

// Auth API
export const authAPI = {
  async sendCode(email: string) {
    const res = await fetch(`${API_BASE}/auth/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to send code");
    return res.json();
  },

  async verifyCode(email: string, code: string) {
    const res = await fetch(`${API_BASE}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) throw new Error("Invalid code");
    const data = await res.json();
    // Store user ID in localStorage
    localStorage.setItem("userId", data.user.id);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  },

  logout() {
    localStorage.removeItem("userId");
  }
};

// Users API
export const usersAPI = {
  async getAdmin() {
    const res = await fetch(`${API_BASE}/users/admin`);
    if (!res.ok) throw new Error("Failed to fetch admin user");
    const data = await res.json();
    return data.user;
  }
};

// Courses API
export const coursesAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/courses`);
    if (!res.ok) throw new Error("Failed to fetch courses");
    const data = await res.json();
    return data.courses;
  },

  async getOne(id: string) {
    const res = await fetch(`${API_BASE}/courses/${id}`);
    if (!res.ok) throw new Error("Failed to fetch course");
    return res.json();
  },

  async create(course: any) {
    const res = await fetch(`${API_BASE}/courses`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(course),
    });
    if (!res.ok) throw new Error("Failed to create course");
    const data = await res.json();
    return data.course;
  },

  async update(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update course");
    const data = await res.json();
    return data.course;
  },

  async delete(id: string) {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete course");
    return res.json();
  },

  async reorder(courseIds: string[]) {
    const res = await fetch(`${API_BASE}/courses/reorder`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ courseIds }),
    });
    if (!res.ok) throw new Error("Failed to reorder courses");
    return res.json();
  }
};

// Modules API
export const modulesAPI = {
  async create(module: any) {
    const res = await fetch(`${API_BASE}/modules`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(module),
    });
    if (!res.ok) throw new Error("Failed to create module");
    const data = await res.json();
    return data.module;
  },

  async update(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/modules/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update module");
    const data = await res.json();
    return data.module;
  },

  async delete(id: string) {
    const res = await fetch(`${API_BASE}/modules/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete module");
    return res.json();
  }
};

// Progress API
export const progressAPI = {
  async get() {
    const res = await fetch(`${API_BASE}/progress`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch progress");
    const data = await res.json();
    return data.progress;
  },

  async update(moduleId: string, isCompleted: boolean): Promise<{ progress: any; streak: { currentStreak: number; longestStreak: number; streakIncreased: boolean } | null }> {
    const res = await fetch(`${API_BASE}/progress`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        moduleId,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      }),
    });
    if (!res.ok) throw new Error("Failed to update progress");
    return res.json();
  },

  async trackAccess(moduleId: string) {
    const res = await fetch(`${API_BASE}/progress/track-access`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ moduleId }),
    });
    if (!res.ok) throw new Error("Failed to track access");
    return true;
  },

  async getLastAccessed(): Promise<{ moduleId: string; courseId: string } | null> {
    const res = await fetch(`${API_BASE}/progress/last-accessed`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to get last accessed");
    const data = await res.json();
    return data.lastAccessed;
  },

  async getRecentCourses(limit: number = 3): Promise<string[]> {
    const res = await fetch(`${API_BASE}/progress/recent-courses?limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to get recent courses");
    const data = await res.json();
    return data.courseIds;
  }
};

// Streak API
export const streakAPI = {
  async get(): Promise<{ currentStreak: number; longestStreak: number; lastActivityDate: string | null }> {
    const res = await fetch(`${API_BASE}/streak`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch streak");
    return res.json();
  }
};

// Unlocks API
export const unlocksAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/unlocks`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch unlocks");
    const data = await res.json();
    return data.unlocks;
  },

  async isUnlocked(courseId: string) {
    const res = await fetch(`${API_BASE}/unlocks/${courseId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to check unlock status");
    const data = await res.json();
    return data.isUnlocked;
  },

  async unlock(courseId: string) {
    const res = await fetch(`${API_BASE}/unlocks/${courseId}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to unlock course");
    const data = await res.json();
    return data.unlock;
  }
};

// Messages API
export const messagesAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  async getConversation(partnerId: string) {
    const res = await fetch(`${API_BASE}/messages/${partnerId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch conversation");
    return res.json();
  },

  async send(recipientId: string, text: string, subject?: string) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ recipientId, text, subject, isRead: false }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    const data = await res.json();
    return data.message;
  },

  async updateStatus(topicId: string, status: "open" | "resolved") {
    const res = await fetch(`${API_BASE}/messages/${topicId}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update topic status");
    return res.json();
  }
};

// Comments API
export const commentsAPI = {
  async getForCourse(courseId: string) {
    const res = await fetch(`${API_BASE}/comments/${courseId}`);
    if (!res.ok) throw new Error("Failed to fetch comments");
    return res.json();
  },

  async create(courseId: string, text: string) {
    const res = await fetch(`${API_BASE}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ courseId, text }),
    });
    if (!res.ok) throw new Error("Failed to create comment");
    return res.json();
  }
};

// Settings API
export const settingsAPI = {
  async get(key: string) {
    const res = await fetch(`${API_BASE}/settings/${key}`);
    if (!res.ok) throw new Error("Failed to fetch setting");
    const data = await res.json();
    return data.setting;
  },

  async update(key: string, value: string) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error("Failed to update setting");
    const data = await res.json();
    return data.setting;
  }
};

// AI Chat API
export const chatAPI = {
  async send(message: string, conversationHistory?: { lastResponseId: string | null }): Promise<{ reply: string; responseId: string | null }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationHistory }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get AI response");
    }
    const data = await res.json();
    return { reply: data.reply, responseId: data.responseId };
  }
};

// Events API (Luma)
export const eventsAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Failed to fetch events" }));
      throw new Error(error.error || "Failed to fetch events");
    }
    const data = await res.json();
    return data.events;
  }
};

// Tools API
export const toolsAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/tools`);
    if (!res.ok) throw new Error("Failed to fetch tools");
    const data = await res.json();
    return data.tools;
  },

  async getOne(id: string) {
    const res = await fetch(`${API_BASE}/tools/${id}`);
    if (!res.ok) throw new Error("Failed to fetch tool");
    const data = await res.json();
    return data.tool;
  },

  async create(tool: { title: string; description: string; category: string; linkType: string; url: string; order?: number }) {
    const res = await fetch(`${API_BASE}/tools`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(tool),
    });
    if (!res.ok) throw new Error("Failed to create tool");
    const data = await res.json();
    return data.tool;
  },

  async update(id: string, updates: Partial<{ title: string; description: string; category: string; linkType: string; url: string; order: number }>) {
    const res = await fetch(`${API_BASE}/tools/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update tool");
    const data = await res.json();
    return data.tool;
  },

  async delete(id: string) {
    const res = await fetch(`${API_BASE}/tools/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete tool");
    return res.json();
  }
};
