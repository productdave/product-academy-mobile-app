import { useUser } from "@/lib/user-context";
import { settingsAPI, coursesAPI, toolsAPI, progressAPI, eventsAPI } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Link, useLocation } from "wouter";
import { Bot, Wrench, BookOpen, Calendar, ChevronRight, LogOut, Settings, User, MessageSquare, Target, ClipboardList, HelpCircle, Sparkles, PlayCircle, Clock, CalendarDays, ExternalLink } from "lucide-react";
import logoImage from "@assets/1_1768974373655.png";
import { Button } from "@/components/ui/button";
import ReactPlayer from "react-player";
import { format, parseISO, isValid } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  linkType: string;
  url: string;
}

interface Progress {
  moduleId: string;
  isCompleted: boolean;
}

interface CourseWithModules extends Course {
  modules?: { id: string; title: string; order: number }[];
}

interface LumaEvent {
  id: string;
  name: string;
  start_at: string;
  url: string;
  cover_url?: string | null;
}

export default function HomePage() {
  const { user, logout } = useUser();
  const [, navigate] = useLocation();
  const isLoggedIn = !!user;
  
  const { data: heroTitle = "Break Into Product Management" } = useQuery({
    queryKey: ["settings", "hero_title"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("hero_title");
        return setting?.value || "Break Into Product Management";
      } catch { return "Break Into Product Management"; }
    },
  });
  
  const { data: heroDescription = "Build the skills, knowledge, and confidence you need to land your first PM role." } = useQuery({
    queryKey: ["settings", "hero_description"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("hero_description");
        return setting?.value || "Build the skills, knowledge, and confidence you need to land your first PM role.";
      } catch { return "Build the skills, knowledge, and confidence you need to land your first PM role."; }
    },
  });

  const { data: heroVideoId = "" } = useQuery({
    queryKey: ["settings", "hero_video_id"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("hero_video_id");
        return setting?.value || "";
      } catch { return ""; }
    },
  });

  const { data: events = [] } = useQuery<LumaEvent[]>({
    queryKey: ["luma-events"],
    queryFn: eventsAPI.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const formatEventDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return "";
      return format(date, "MMM d");
    } catch { return ""; }
  };
  
  const { data: courses = [] } = useQuery<CourseWithModules[]>({
    queryKey: ["courses"],
    queryFn: coursesAPI.getAll,
  });

  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: toolsAPI.getAll,
  });

  const { data: progress = [] } = useQuery<Progress[]>({
    queryKey: ["progress"],
    queryFn: progressAPI.get,
    enabled: isLoggedIn,
  });

  const progressModuleIds = new Set(progress.map(p => p.moduleId));
  const completedModuleIds = new Set(progress.filter(p => p.isCompleted).map(p => p.moduleId));

  const coursesInProgress = courses.filter(course => {
    if (!course.modules || course.modules.length === 0) return false;
    const courseModuleIds = course.modules.map(m => m.id);
    const hasStarted = courseModuleIds.some(id => progressModuleIds.has(id));
    const allCompleted = courseModuleIds.every(id => completedModuleIds.has(id));
    return hasStarted && !allCompleted;
  });

  const latestCourses = courses.slice(0, 3);
  const latestTools = tools.slice(0, 3);

  const aiCoachingFlows = [
    {
      id: "quick_quiz",
      title: "PM Skills Quiz",
      description: "Test your product management knowledge with quick questions",
      icon: Target,
    },
    {
      id: "product_teardown",
      title: "Product Teardown",
      description: "Analyze real products and learn what makes them successful",
      icon: ClipboardList,
    },
    {
      id: "interview_prep",
      title: "Interview Prep",
      description: "Practice PM interview questions with AI feedback",
      icon: MessageSquare,
    },
    {
      id: "general_question",
      title: "General Question",
      description: "Ask anything about product management",
      icon: HelpCircle,
    },
  ];

  const resourceLinks = [
    {
      id: "courses",
      title: "Courses",
      description: "Learn PM fundamentals step by step",
      href: "/resources",
      icon: BookOpen,
    },
    {
      id: "templates",
      title: "Templates",
      description: "Frameworks and tools for PM success",
      href: "/resources",
      icon: Wrench,
    },
    {
      id: "book",
      title: "Book Dave",
      description: "Schedule a 1:1 coaching session",
      href: "/book",
      icon: Calendar,
    },
  ];

  return (
    <Layout>
      <div className="px-6 pt-8 pb-6 bg-white min-h-screen" data-testid="home-page">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Product Academy" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground leading-tight">
                Product Academy
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Learn. Build. Grow.</p>
            </div>
          </div>
          
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" /> Profile Settings
                  </DropdownMenuItem>
                </Link>
                {user?.role === "admin" && (
                   <Link href="/admin">
                     <DropdownMenuItem className="cursor-pointer font-medium text-primary bg-primary/5">
                       <Settings className="w-4 h-4 mr-2" /> Admin Dashboard
                     </DropdownMenuItem>
                   </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" variant="outline" asChild data-testid="button-login">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2" data-testid="text-hero-title">
            {heroTitle}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-hero-description">
            {heroDescription}
          </p>
        </div>

        {heroVideoId && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg" data-testid="hero-video">
            <div className="aspect-video bg-black">
              <ReactPlayer
                src={`https://www.youtube.com/watch?v=${heroVideoId}`}
                width="100%"
                height="100%"
                controls
              />
            </div>
          </div>
        )}

        {isLoggedIn && coursesInProgress.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-heading font-bold text-foreground">Continue Learning</h3>
            </div>
            
            <div className="space-y-3" data-testid="list-continue">
              {coursesInProgress.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-3 border border-primary/20 cursor-pointer hover:border-primary/40 transition-all group"
                  onClick={() => navigate(`/course/${course.id}`)}
                  data-testid={`card-continue-${course.id}`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate" data-testid={`text-continue-title-${course.id}`}>
                      {course.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">Continue where you left off</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {(latestCourses.length > 0 || latestTools.length > 0) && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-heading font-bold text-foreground">Latest Resources</h3>
              <Link href="/resources" className="text-xs font-medium text-primary hover:underline flex items-center" data-testid="link-view-all-resources">
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
            
            <div className="space-y-3" data-testid="list-latest">
              {latestCourses.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/course/${course.id}`)}
                  data-testid={`card-latest-course-${course.id}`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">Course</span>
                    </div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate" data-testid={`text-latest-course-title-${course.id}`}>
                      {course.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              ))}
              
              {latestTools.slice(0, 2).map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => window.open(tool.url, "_blank")}
                  data-testid={`card-latest-tool-${tool.id}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase font-medium text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">Template</span>
                    </div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate" data-testid={`text-latest-tool-title-${tool.id}`}>
                      {tool.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-heading font-bold text-foreground">AI Coaching</h3>
            <Link href="/ai-chat" className="text-xs font-medium text-primary hover:underline flex items-center" data-testid="link-view-all-ai">
              View All <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          
          <div className="space-y-3" data-testid="list-ai-coaching">
            {aiCoachingFlows.map((flow) => (
              <Link key={flow.id} href={`/ai-chat?flow=${flow.id}`}>
                <div 
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                  data-testid={`card-ai-${flow.id}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <flow.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors" data-testid={`text-ai-title-${flow.id}`}>
                      {flow.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1" data-testid={`text-ai-description-${flow.id}`}>
                      {flow.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {events.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-heading font-bold text-foreground">Upcoming Events</h3>
              </div>
              <Link href="/events" className="text-sm text-primary font-medium flex items-center gap-1" data-testid="link-view-all-events">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3" data-testid="list-events">
              {events.slice(0, 3).map((event) => (
                <a
                  key={event.id}
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
                  data-testid={`card-event-${event.id}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs text-primary font-medium">{formatEventDate(event.start_at)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1" data-testid={`text-event-title-${event.id}`}>
                      {event.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">Live Event</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-heading font-bold text-foreground">Role-Play Practice</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5" data-testid="section-roleplay">
            <p className="text-sm text-slate-600">
              Practice difficult PM conversations with AI role-play scenarios — stakeholder negotiations, executive presentations, and cross-functional alignment using proven frameworks.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-heading font-bold text-foreground mb-4">Resources</h3>
          
          <div className="space-y-3" data-testid="list-resources">
            {resourceLinks.map((resource) => (
              <Link key={resource.id} href={resource.href}>
                <div 
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                  data-testid={`card-resource-${resource.id}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <resource.icon className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors" data-testid={`text-resource-title-${resource.id}`}>
                      {resource.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1" data-testid={`text-resource-description-${resource.id}`}>
                      {resource.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {!isLoggedIn && (
          <div className="mt-8 mb-4 text-center py-8 px-4 bg-slate-50 rounded-3xl border border-slate-100" data-testid="section-cta">
            <div className="mb-4">
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">Ready to start your PM journey?</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Sign in to access AI coaching, track your progress, and get personalized recommendations.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
              <Button className="flex-1" asChild data-testid="button-signin-bottom">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild data-testid="button-register-bottom">
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
