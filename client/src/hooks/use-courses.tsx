import { useQuery } from "@tanstack/react-query";
import { coursesAPI, progressAPI } from "@/lib/api";
import { useUser } from "@/lib/user-context";

export interface Module {
  id: string;
  title: string;
  duration: string;
  videoId: string;
  order: number;
  isCompleted?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  stage?: number | null;
  roadmapHeading?: string | null;
  roadmapSubheading?: string | null;
  isLocked: boolean;
  modules?: Module[];
}

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const courses = await coursesAPI.getAll();
      return courses;
    },
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const data = await coursesAPI.getOne(id);
      // API returns { course, modules } - combine them into a single course object
      return {
        ...data.course,
        modules: data.modules || [],
      } as Course;
    },
    enabled: !!id,
  });
}

export function useProgress() {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ["progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const progress = await progressAPI.get();
      return progress;
    },
    enabled: !!user,
  });
}

// Combine courses with user progress
export function useCoursesWithProgress() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: progress, isLoading: progressLoading } = useProgress();

  const coursesWithProgress = courses?.map(course => ({
    ...course,
    modules: course.modules?.map(module => ({
      ...module,
      isCompleted: progress?.some((p: any) => p.moduleId === module.id && p.isCompleted) || false,
    })),
  }));

  return {
    courses: coursesWithProgress || [],
    isLoading: coursesLoading || progressLoading,
  };
}
