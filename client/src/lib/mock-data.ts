import { create } from "zustand";
import logoImage from "@assets/logo.png";

// --- Types ---

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: "creator" | "student" | "admin";
  email?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface Module {
  id: string;
  title: string;
  duration: string;
  videoId: string; // YouTube Video ID
  isCompleted: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string; // HTML/Rich text supported
  instructor: string;
  thumbnail: string;
  modules: Module[];
  comments: Comment[];
  stage?: number; // 1-5 for roadmap hops
  isLocked?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Thread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
}

export interface RoadmapStage {
  id: number;
  title: string;
  description: string;
  courseIds: string[];
}

// --- Mock Data ---

// Default users for simulation
export const MOCK_USERS = {
  admin: {
    id: "admin1",
    name: "Product Dave",
    avatar: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/246750-d158-4c37-0c6f-1a11e5262063_IMG_4971.JPG",
    role: "admin" as const,
    email: "david@davidwang.com.au"
  },
  student: {
    id: "u2",
    name: "Guest Student",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&h=256&q=80",
    role: "student" as const,
    email: "student@gmail.com"
  }
};

// We export a mutable reference for backward compatibility with existing code
// but the store will manage the source of truth
export let currentUser: User = MOCK_USERS.student;

export const courses: Course[] = [
  {
    id: "c1",
    title: "Anyone Can Be a Product Manager (with AI)",
    instructor: "Product Dave",
    thumbnail: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/e50a15e-0efe-0d2e-4153-0564e10bd56b_vlcsnap-2025-03-16-10h57m38s900.png",
    stage: 1,
    isLocked: false,
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
      <br/>
      <p>Designed to fast-track your Product Management journey with access to practical, no-fluff courses, insider frameworks, and real examples.</p>
    `,
    modules: [
      { id: "m1", title: "Topic #1: The Product Function & Role", duration: "10:24", videoId: "9xwazD5SyVg", isCompleted: true },
      { id: "m2", title: "Topic #2: The End-to-End PM Process", duration: "15:30", videoId: "LXb3EKWsInQ", isCompleted: false },
      { id: "m3", title: "Topic #3: Managing Product Ideas", duration: "12:45", videoId: "ysz5S6PUM-U", isCompleted: false },
      { id: "m4", title: "Topic #4: Objectives & Metrics (OKRs)", duration: "20:10", videoId: "9xwazD5SyVg", isCompleted: false },
      { id: "m5", title: "Topic #5: Mapping Product Assumptions", duration: "14:20", videoId: "LXb3EKWsInQ", isCompleted: false },
    ],
    comments: [
      { id: "cm1", userId: "s1", userName: "Sarah L.", userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", text: "Finally understand how to use OKRs correctly!", timestamp: "2 days ago" },
      { id: "cm2", userId: "s2", userName: "Mike T.", userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", text: "The section on assumptions was an eye opener.", timestamp: "5 hours ago" },
    ]
  },
  {
    id: "c2",
    title: "Break into PM BlueStrategy",
    instructor: "Product Dave",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
    description: "Your strategic roadmap to landing that first Product Management role.",
    stage: 2,
    isLocked: false,
    modules: [
      { id: "m6", title: "Finding Your Product Journey", duration: "08:15", videoId: "ysz5S6PUM-U", isCompleted: false },
      { id: "m7", title: "Resume & Interview Prep", duration: "18:20", videoId: "LXb3EKWsInQ", isCompleted: false },
    ],
    comments: []
  },
  {
    id: "c3",
    title: "Advanced Product Strategy",
    instructor: "Product Dave",
    thumbnail: "https://images.unsplash.com/photo-1553877607-422830722365?w=800&auto=format&fit=crop&q=60",
    description: "Master the art of product strategy and vision.",
    stage: 3,
    isLocked: true,
    modules: [
        { id: "m8", title: "Vision vs Strategy", duration: "12:00", videoId: "ysz5S6PUM-U", isCompleted: false }
    ],
    comments: []
  },
  {
    id: "c4",
    title: "Leadership & Stakeholder Management",
    instructor: "Product Dave",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60",
    description: "Learn to influence without authority.",
    stage: 4,
    isLocked: true,
    modules: [],
    comments: []
  },
  {
    id: "c5",
    title: "Product Executive Masterclass",
    instructor: "Product Dave",
    thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=60",
    description: "Scaling product organizations and culture.",
    stage: 5,
    isLocked: true,
    modules: [],
    comments: []
  }
];

export const roadmapStages: RoadmapStage[] = [
    { id: 1, title: "Hop 1: The Foundation", description: "Learn core PM skills", courseIds: ["c1"] },
    { id: 2, title: "Hop 2: The Break-in", description: "Land your first role", courseIds: ["c2"] },
    { id: 3, title: "Hop 3: The Strategist", description: "Master product strategy", courseIds: ["c3"] },
    { id: 4, title: "Hop 4: The Leader", description: "Influence & Leadership", courseIds: ["c4"] },
    { id: 5, title: "Hop 5: The Executive", description: "Scale & Culture", courseIds: ["c5"] },
];

export const initialThreads: Thread[] = [
  {
    id: "t1",
    participantId: "u1",
    participantName: "Product Dave",
    participantAvatar: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/246750-d158-4c37-0c6f-1a11e5262063_IMG_4971.JPG",
    lastMessage: "Let me know if you need help with the case study!",
    unreadCount: 1,
    messages: [
      { id: "msg1", senderId: "u1", text: "Hi! Welcome to the course. I'm Dave.", timestamp: "Yesterday", isRead: true },
      { id: "msg2", senderId: "u2", text: "Thanks Dave! Excited to start.", timestamp: "Yesterday", isRead: true },
      { id: "msg3", senderId: "u1", text: "Let me know if you need help with the case study!", timestamp: "10:00 AM", isRead: false },
    ]
  }
];

// Admin view of messages (incoming from students)
export const adminThreads: Thread[] = [
  {
    id: "at1",
    participantId: "u2",
    participantName: "Guest Student",
    participantAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&h=256&q=80",
    lastMessage: "Thanks Dave! Excited to start.",
    unreadCount: 1,
    messages: [
      { id: "amsg1", senderId: "u1", text: "Hi! Welcome to the course. I'm Dave.", timestamp: "Yesterday", isRead: true },
      { id: "amsg2", senderId: "u2", text: "Thanks Dave! Excited to start.", timestamp: "Yesterday", isRead: false },
    ]
  },
  {
    id: "at2",
    participantId: "s3",
    participantName: "Sarah Jenkins",
    participantAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "I'm having trouble with the SWOT analysis module.",
    unreadCount: 1,
    messages: [
      { id: "amsg3", senderId: "s3", text: "I'm having trouble with the SWOT analysis module. Can you explain the difference between opportunities and strengths again?", timestamp: "2 hours ago", isRead: false },
    ]
  }
];

// --- Store ---

interface AppState {
  threads: Thread[];
  adminThreads: Thread[];
  courses: Course[];
  user: User;
  
  // Settings
  calendlyUrl: string;
  openAIKey: string;
  
  // Actions
  addMessage: (threadId: string, text: string, senderId: string) => void;
  markAsRead: (threadId: string) => void;
  unlockCourse: (courseId: string) => void;
  isLoggedIn: boolean;
  login: (email?: string) => void;
  logout: () => void;
  updateAvatar: (avatarUrl: string) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  createThread: (subject: string, message: string) => void;
  
  // Admin Actions
  updateCourse: (course: Course) => void;
  addCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;
  updateSettings: (settings: { calendlyUrl?: string, openAIKey?: string }) => void;
}

export const useStore = create<AppState>((set) => ({
  threads: initialThreads,
  adminThreads: adminThreads,
  courses: courses,
  user: MOCK_USERS.student, // Default user
  
  calendlyUrl: "https://calendly.com/productdave",
  openAIKey: "",

  isLoggedIn: false, // Default to false (logged out)
  showLoginModal: false,
  
  login: (email) => set((state) => {
    let user: User = MOCK_USERS.student;
    
    // Check for admin email
    if (email === "david@davidwang.com.au") {
      user = MOCK_USERS.admin;
    } else if (email) {
      // Create a mock user for other emails if needed, or just stick to student persona
      user = { ...MOCK_USERS.student, email, name: email.split('@')[0] };
    }
    
    // Update the exported currentUser reference
    currentUser = user;
    
    return { isLoggedIn: true, showLoginModal: false, user };
  }),
  
  logout: () => {
    // Reset to default student
    currentUser = MOCK_USERS.student;
    return set({ isLoggedIn: false, user: MOCK_USERS.student });
  },
  
  updateAvatar: (avatarUrl) => set((state) => {
    const updatedUser = { ...state.user, avatar: avatarUrl };
    currentUser = updatedUser;
    return { user: updatedUser };
  }),
  
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  
  createThread: (subject, message) => set((state) => ({
    threads: [{
      id: `t${Date.now()}`,
      participantId: "u1",
      participantName: "Product Dave",
      participantAvatar: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/246750-d158-4c37-0c6f-1a11e5262063_IMG_4971.JPG",
      lastMessage: message,
      unreadCount: 0,
      messages: [{
        id: `msg${Date.now()}`,
        senderId: state.user.id,
        text: message,
        timestamp: "Just now",
        isRead: true
      }]
    }, ...state.threads]
  })),
  
  addMessage: (threadId, text, senderId) => set((state) => ({
    threads: state.threads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          lastMessage: text,
          messages: [...t.messages, {
            id: Math.random().toString(),
            senderId,
            text,
            timestamp: "Just now",
            isRead: true
          }]
        };
      }
      return t;
    })
  })),
  
  markAsRead: (threadId) => set((state) => ({
    threads: state.threads.map(t => 
      t.id === threadId ? { ...t, unreadCount: 0 } : t
    )
  })),
  
  unlockCourse: (courseId) => set((state) => ({
    courses: state.courses.map(c => 
      c.id === courseId ? { ...c, isLocked: false } : c
    )
  })),

  // Admin Actions
  updateCourse: (updatedCourse) => set((state) => ({
    courses: state.courses.map(c => c.id === updatedCourse.id ? updatedCourse : c)
  })),
  
  addCourse: (newCourse) => set((state) => ({
    courses: [...state.courses, newCourse]
  })),
  
  deleteCourse: (courseId) => set((state) => ({
    courses: state.courses.filter(c => c.id !== courseId)
  })),
  
  updateSettings: (settings) => set((state) => ({
    ...settings
  }))
}));

// Helper to get raw current user without hook for legacy components
export const getCurrentUser = () => currentUser;
