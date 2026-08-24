import { useRoute, Link } from "wouter";
import { useCourse, useProgress, Module } from "@/hooks/use-courses";
import { useUser } from "@/lib/user-context";
import { progressAPI, commentsAPI, unlocksAPI } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { ChevronLeft, Play, CheckCircle, Lock, Unlock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function CoursePage() {
  const [match, params] = useRoute("/course/:id");
  const courseId = params?.id || "";
  
  const { user } = useUser();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: progress } = useProgress();
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", courseId],
    queryFn: () => commentsAPI.getForCourse(courseId),
    enabled: !!courseId,
  });
  
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  // Query to check if user has unlocked this course
  const { data: isUnlocked } = useQuery({
    queryKey: ["unlocks", courseId],
    queryFn: () => unlocksAPI.isUnlocked(courseId),
    enabled: !!courseId && !!user,
  });

  // Mutation for unlocking course
  const unlockMutation = useMutation({
    mutationFn: () => unlocksAPI.unlock(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unlocks", courseId] });
      setShowUnlockDialog(false);
      toast({
        title: "Course Unlocked!",
        description: "You can now access all modules in this course.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unlock course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for posting comments
  const postCommentMutation = useMutation({
    mutationFn: (text: string) => commentsAPI.create(courseId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", courseId] });
      setCommentText("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for marking modules complete
  const updateProgressMutation = useMutation({
    mutationFn: ({ moduleId, isCompleted }: { moduleId: string; isCompleted: boolean }) =>
      progressAPI.update(moduleId, isCompleted),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["progress", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
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

  if (courseLoading) {
    return (
      <Layout>
        <div className="relative h-64 w-full">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="px-6 -mt-8 relative z-10">
          <div className="bg-card rounded-3xl p-6 shadow-xl border border-border/50">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Course not found</p>
          <Button asChild className="mt-4">
            <Link href="/courses">Back to Courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Combine course modules with user progress
  const modulesWithProgress = course.modules?.map((module: Module) => ({
    ...module,
    isCompleted: progress?.some((p: any) => p.moduleId === module.id && p.isCompleted) || false,
  })) || [];

  const handleUnlock = () => {
    unlockMutation.mutate();
  };

  // Determine if the course is locked for the current user
  // A course is locked if: it has isLocked=true AND the user hasn't unlocked it
  const isCourseLocked = course?.isLocked && !isUnlocked;

  const handlePostComment = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to post comments.",
        variant: "destructive",
      });
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    postCommentMutation.mutate(commentText);
  };

  const hasStarted = modulesWithProgress.some((m: Module & { isCompleted?: boolean }) => m.isCompleted);
  const nextLesson = modulesWithProgress.find((m: Module & { isCompleted?: boolean }) => !m.isCompleted) || modulesWithProgress[0];

  const comments = commentsData?.comments || [];

  return (
    <Layout>
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock this course?</DialogTitle>
            <DialogDescription>
              Please confirm that you have completed the prerequisite modules. Skipping ahead might affect your learning journey!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnlockDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnlock}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? "Unlocking..." : "Yes, I'm ready"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header Image */}
      <div className="relative h-64 w-full">
        <img src={course.thumbnail} className="w-full h-full object-cover" alt={course.title} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-background" />
        <Link href="/">
          <div className="absolute top-12 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors z-20">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </Link>
        {isCourseLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10">
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-heading mb-2">Course Locked</h2>
            <p className="text-sm text-white/80 max-w-xs">Complete the previous stage to unlock this content.</p>
          </div>
        )}
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-card rounded-3xl p-6 shadow-xl border border-border/50">
          <h1 className="text-2xl font-heading font-bold mb-2">{course.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">By {course.instructor}</p>
          
          {isCourseLocked ? (
            <Button 
              className="w-full rounded-xl py-6 text-base shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary/80" 
              onClick={() => setShowUnlockDialog(true)}
              disabled={unlockMutation.isPending}
              data-testid="button-unlock-course"
            >
              <Unlock className="w-4 h-4 mr-2" /> {unlockMutation.isPending ? "Unlocking..." : "Unlock Course"}
            </Button>
          ) : (
            <Button 
              className="w-full rounded-xl py-6 text-base shadow-lg shadow-primary/20" 
              asChild
              data-testid="button-start-learning"
            >
              <Link href={nextLesson ? `/course/${course.id}/lesson/${nextLesson.id}` : "#"}>
                {hasStarted ? "Resume Lesson" : "Start Learning"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 mt-8">
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="w-full bg-secondary/50 rounded-xl p-1 mb-6">
            <TabsTrigger 
              value="modules" 
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              data-testid="tab-modules"
            >
              Modules
            </TabsTrigger>
            <TabsTrigger 
              value="about" 
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              data-testid="tab-about"
            >
              About
            </TabsTrigger>
            <TabsTrigger 
              value="comments" 
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              data-testid="tab-comments"
            >
              Comments
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="modules" className="space-y-4 pb-12">
            {isCourseLocked ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Unlock this course to view modules.</p>
              </div>
            ) : (
              modulesWithProgress.map((module: Module & { isCompleted?: boolean }, index: number) => (
                <Link key={module.id} href={`/course/${course.id}/lesson/${module.id}`}>
                  <div 
                    className="group flex items-center p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-all cursor-pointer"
                    data-testid={`module-item-${module.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 mr-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {module.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" data-testid={`icon-completed-${module.id}`} />
                      ) : (
                        <span className="font-bold font-mono text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{module.title}</h4>
                      <span className="text-xs text-muted-foreground">{module.duration}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                      <Play className="w-3 h-3 ml-0.5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))
            )}
            {!isCourseLocked && modulesWithProgress.length === 0 && (
               <div className="text-center py-8 text-muted-foreground text-sm">
                 No modules available yet.
               </div>
            )}
          </TabsContent>
          
          <TabsContent value="about" className="pb-12">
            <div 
              className="prose prose-sm prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </TabsContent>

          <TabsContent value="comments" className="pb-12">
            <div className="space-y-6">
              {/* Comment input */}
              {user ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Share your thoughts about this course..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[100px] rounded-xl resize-none"
                    data-testid="input-comment"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handlePostComment}
                      disabled={!commentText.trim() || postCommentMutation.isPending}
                      className="rounded-xl"
                      data-testid="button-post-comment"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {postCommentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-secondary/20 rounded-xl">
                  <p className="text-sm text-muted-foreground">Please log in to post comments</p>
                </div>
              )}

              {/* Comments list */}
              <div className="space-y-4 mt-8">
                {commentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment: any) => (
                    <div 
                      key={comment.id} 
                      className="flex gap-3 p-4 rounded-xl bg-card border border-border/50"
                      data-testid={`comment-${comment.id}`}
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={comment.user?.avatar} alt={comment.user?.name} />
                        <AvatarFallback>{comment.user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user?.name || "Anonymous"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
