import { useRoute, Link } from "wouter";
import { useCourse, Module } from "@/hooks/use-courses";
import { useUser } from "@/lib/user-context";
import { progressAPI } from "@/lib/api";
import Layout from "@/components/layout";
import { ChevronLeft, Send, Flame } from "lucide-react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function LessonPage() {
  const [match, params] = useRoute("/course/:courseId/lesson/:lessonId");
  const [commentText, setCommentText] = useState("");
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const courseId = params?.courseId || "";
  const lessonId = params?.lessonId || "";
  
  const { data: course, isLoading } = useCourse(courseId);
  
  // Find the specific module by matching lessonId
  const module = course?.modules?.find((m: Module) => m.id === lessonId);
  
  // Find the next module
  const currentModuleIndex = course?.modules?.findIndex((m: Module) => m.id === lessonId) ?? -1;
  const nextModule = currentModuleIndex >= 0 && course?.modules 
    ? course.modules[currentModuleIndex + 1] 
    : undefined;

  // Track module access for resume functionality
  useEffect(() => {
    if (user && lessonId) {
      progressAPI.trackAccess(lessonId).catch(console.error);
      // Invalidate caches so home page gets updated data
      queryClient.invalidateQueries({ queryKey: ["lastAccessed"] });
      queryClient.invalidateQueries({ queryKey: ["recentCourses"] });
    }
  }, [user, lessonId, queryClient]);

  // Mutation for marking module complete
  const markCompleteMutation = useMutation({
    mutationFn: async (isCompleted: boolean) => {
      return await progressAPI.update(lessonId, isCompleted);
    },
    onSuccess: (data) => {
      // Invalidate and refetch course data to update completion status
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      
      // Show streak celebration toast only if streak actually increased
      if (data.streak && data.streak.streakIncreased) {
        const streakMessages = [
          "Keep it up!",
          "You're on fire!",
          "Amazing dedication!",
          "Unstoppable!",
          "Learning machine!",
        ];
        const randomMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)];
        
        toast({
          title: `🔥 ${data.streak.currentStreak} Day Streak!`,
          description: randomMessage,
        });
      }
    },
  });

  const handleMarkComplete = () => {
    markCompleteMutation.mutate(!module?.isCompleted);
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="sticky top-0 z-50 bg-black">
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (!course || !module) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <h1 className="text-xl font-bold mb-2">Lesson not found</h1>
          <p className="text-muted-foreground mb-4">The lesson you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/courses">Back to Courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="sticky top-0 z-50 bg-black">
        <div className="absolute top-4 left-4 z-10">
          <Link href={`/course/${course.id}`}>
            <div 
              className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black/70"
              data-testid="button-back-to-course"
            >
              <ChevronLeft className="w-6 h-6" />
            </div>
          </Link>
        </div>
        <div className="aspect-video w-full bg-black">
          <ReactPlayer 
            src={`https://www.youtube.com/watch?v=${module.videoId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
            width="100%"
            height="100%"
            controls
          />
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xl font-heading font-bold" data-testid="text-module-title">
            {module.title}
          </h1>
          <Button
            onClick={handleMarkComplete}
            variant={module.isCompleted ? "secondary" : "default"}
            size="sm"
            disabled={markCompleteMutation.isPending}
            data-testid="button-mark-complete"
            className={module.isCompleted ? "bg-secondary text-secondary-foreground" : ""}
          >
            {markCompleteMutation.isPending 
              ? "Updating..." 
              : module.isCompleted 
                ? "Completed" 
                : "Mark Complete"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6" data-testid="text-course-title">
          Module from: {course.title}
        </p>

        <div className="mb-8">
          <h3 className="font-semibold mb-4">Discussion</h3>
          <div className="space-y-6 mb-6">
            <div className="text-center text-muted-foreground text-sm py-4">
              No comments yet. Be the first!
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Input 
              placeholder="Add a comment..." 
              className="rounded-full bg-secondary border-none h-12 px-5 focus-visible:ring-1"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              data-testid="input-comment"
            />
            <Button 
              size="icon" 
              className="rounded-full h-12 w-12 shrink-0"
              data-testid="button-send-comment"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {nextModule && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mb-8" data-testid="card-next-module">
            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Up Next</p>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium" data-testid="text-next-module-title">{nextModule.title}</h4>
                <p className="text-xs text-muted-foreground" data-testid="text-next-module-duration">
                  {nextModule.duration}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full" 
                asChild
                data-testid="button-play-next"
              >
                <Link href={`/course/${course.id}/lesson/${nextModule.id}`}>Play</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
