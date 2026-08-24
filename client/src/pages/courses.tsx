import Layout from "@/components/layout";
import { useCoursesWithProgress } from "@/hooks/use-courses";
import { useUser } from "@/lib/user-context";
import { Link, useLocation } from "wouter";
import { Search, Filter, BookOpen, Clock, Star, PlayCircle, Lock, Unlock, LogIn, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { progressAPI } from "@/lib/api";

interface Progress {
  moduleId: string;
  isCompleted: boolean;
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { courses, isLoading } = useCoursesWithProgress();
  const [courseToUnlock, setCourseToUnlock] = useState<string | null>(null);
  const isLoggedIn = !!user;

  const { data: progress = [] } = useQuery<Progress[]>({
    queryKey: ["progress"],
    queryFn: progressAPI.get,
    enabled: isLoggedIn,
  });

  const categories = ["All", "Foundation", "Strategy", "Leadership", "Career"];

  const progressModuleIds = new Set(progress.map(p => p.moduleId));
  const completedModuleIds = new Set(progress.filter(p => p.isCompleted).map(p => p.moduleId));

  const coursesInProgress = courses.filter(course => {
    if (!course.modules || course.modules.length === 0) return false;
    const courseModuleIds = course.modules.map(m => m.id);
    const hasStarted = courseModuleIds.some(id => progressModuleIds.has(id));
    const allCompleted = courseModuleIds.every(id => completedModuleIds.has(id));
    return hasStarted && !allCompleted;
  });

  const getNextModule = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course?.modules) return null;
    
    for (const module of course.modules) {
      if (!completedModuleIds.has(module.id)) {
        return module;
      }
    }
    return course.modules[0];
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory !== "All") {
      if (selectedCategory === "Foundation" && course.stage !== 1) matchesCategory = false;
      if (selectedCategory === "Strategy" && (course.stage !== 2 && course.stage !== 3)) matchesCategory = false;
      if (selectedCategory === "Leadership" && (course.stage !== 4 && course.stage !== 5)) matchesCategory = false;
      if (selectedCategory === "Career" && course.stage !== 2) matchesCategory = false;
    }

    return matchesSearch && matchesCategory;
  });

  const handleUnlock = () => {
    if (courseToUnlock) {
      setCourseToUnlock(null);
    }
  };

  return (
    <Layout>
      <AlertDialog open={!!courseToUnlock} onOpenChange={(open) => !open && setCourseToUnlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock this course?</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that you have completed the prerequisite modules. Skipping ahead might affect your learning journey!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlock}>Yes, I'm ready</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="pt-12 px-6 pb-24 min-h-screen bg-slate-50">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2" data-testid="text-courses-title">Explore Courses</h1>
          <p className="text-sm text-muted-foreground">Find the perfect course to advance your PM career.</p>
        </div>

        {!isLoggedIn && (
          <div className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4" data-testid="section-login-prompt">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">Save your progress</h3>
                <p className="text-xs text-muted-foreground">Log in to track completed modules and resume where you left off</p>
              </div>
              <Button size="sm" asChild data-testid="button-login-prompt">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        )}

        {isLoggedIn && coursesInProgress.length > 0 && (
          <div className="mb-6" data-testid="section-resume">
            <h2 className="text-lg font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              Resume Learning
            </h2>
            <div className="space-y-3">
              {coursesInProgress.map(course => {
                const nextModule = getNextModule(course.id);
                const totalModules = course.modules?.length || 0;
                const completedCount = course.modules?.filter(m => completedModuleIds.has(m.id)).length || 0;
                const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
                    onClick={() => nextModule ? navigate(`/course/${course.id}/lesson/${nextModule.id}`) : navigate(`/course/${course.id}`)}
                    data-testid={`card-resume-${course.id}`}
                  >
                    <div className="flex">
                      <div className="w-20 h-20 shrink-0 relative">
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 p-3 min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate" data-testid={`text-resume-title-${course.id}`}>
                          {course.title}
                        </h3>
                        {nextModule && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5" data-testid={`text-resume-module-${course.id}`}>
                            Next: {nextModule.title}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                            {completedCount}/{totalModules}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center pr-3">
                        <ChevronRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search courses..." 
              className="pl-9 bg-white border-border/60 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-courses"
            />
          </div>
          <Button variant="outline" size="icon" className="bg-white border-border/60 shadow-sm shrink-0" data-testid="button-filter">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar" data-testid="list-categories">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-white text-muted-foreground border-border hover:bg-secondary"
              )}
              data-testid={`button-category-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-6" data-testid="list-courses">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border shadow-sm">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map(course => {
              const modulesCount = course.modules?.length || 0;
              
              const calculateTotalDuration = () => {
                if (!course.modules || course.modules.length === 0) return "0m";
                
                let totalMinutes = 0;
                course.modules.forEach(module => {
                  const duration = module.duration || "0:00";
                  const parts = duration.split(":");
                  if (parts.length === 2) {
                    const mins = parseInt(parts[0]) || 0;
                    const secs = parseInt(parts[1]) || 0;
                    totalMinutes += mins + Math.round(secs / 60);
                  } else if (parts.length === 3) {
                    const hrs = parseInt(parts[0]) || 0;
                    const mins = parseInt(parts[1]) || 0;
                    totalMinutes += hrs * 60 + mins;
                  }
                });
                
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                
                if (hours > 0) {
                  return `${hours}h ${mins}m`;
                }
                return `${mins}m`;
              };
              
              const totalDuration = calculateTotalDuration();
              const rating = (course as any).rating || null;
              
              const CourseCard = (
                <div className={cn(
                  "group bg-white rounded-2xl overflow-hidden border shadow-sm transition-all hover:shadow-md",
                  course.isLocked ? "opacity-80" : "hover:border-primary/30 cursor-pointer"
                )} data-testid={`card-course-${course.id}`}>
                  <div className="aspect-video relative bg-muted">
                    <img src={course.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={course.title} />
                    {course.isLocked ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-black/60 p-2 rounded-full backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                           <PlayCircle className="w-8 h-8 text-white" />
                         </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                       <Badge variant="secondary" className="bg-white/90 backdrop-blur text-foreground font-bold shadow-sm">
                         {modulesCount} Module{modulesCount !== 1 ? 's' : ''}
                       </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-heading font-bold text-lg leading-tight line-clamp-2" data-testid={`text-course-title-${course.id}`}>{course.title}</h3>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8" data-testid={`text-course-description-${course.id}`}>
                      {course.description.replace(/<[^>]*>/g, '')}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {totalDuration}</span>
                        {rating && (
                          <span className="flex items-center"><Star className="w-3.5 h-3.5 mr-1 text-yellow-400 fill-yellow-400" /> {rating}</span>
                        )}
                      </div>
                      <div className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        course.isLocked ? "text-muted-foreground flex items-center gap-1" : "text-primary"
                      )}>
                        {course.isLocked ? (
                          <>
                            <Unlock className="w-3 h-3" /> Tap to unlock
                          </>
                        ) : "Start Now"}
                      </div>
                    </div>
                  </div>
                </div>
              );

              return (
                <Link key={course.id} href={`/course/${course.id}`}>
                  {CourseCard}
                </Link>
              );
            })
          ) : (
            <div className="text-center py-12" data-testid="status-no-courses">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground font-medium">No courses found matching your criteria.</p>
              <Button variant="link" onClick={() => {setSearchTerm(""); setSelectedCategory("All")}} className="text-primary" data-testid="button-clear-filters">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
