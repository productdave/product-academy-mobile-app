import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useUser } from "@/lib/user-context";
import { coursesAPI, modulesAPI, settingsAPI, toolsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  BookOpen, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Save, 
  Upload, 
  Video, 
  Clock, 
  Star,
  Calendar,
  CalendarDays,
  Image as ImageIcon,
  Bot,
  Loader2,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  videoId: string;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  stage?: number | null;
  roadmapHeading?: string | null;
  roadmapSubheading?: string | null;
  rating?: string | null;
  isLocked: boolean;
  modules?: Module[];
}

export default function AdminDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect non-admin users
  useEffect(() => {
    if (!userLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, userLoading, setLocation]);

  // Fetch courses with modules
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const courses = await coursesAPI.getAll();
      return courses;
    },
  });

  // Fetch settings
  const { data: calendlyUrl = "", isLoading: calendlyLoading } = useQuery({
    queryKey: ["settings", "calendly_url"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("calendly_url");
        return setting?.value || "";
      } catch {
        return "";
      }
    },
  });

  // Hero content settings
  const { data: heroVideoId = "", isLoading: heroVideoLoading } = useQuery({
    queryKey: ["settings", "hero_video_id"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("hero_video_id");
        return setting?.value || "";
      } catch {
        return "";
      }
    },
  });

  const { data: heroTitle = "", isLoading: heroTitleLoading } = useQuery({
    queryKey: ["settings", "hero_title"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("hero_title");
        return setting?.value || "";
      } catch {
        return "";
      }
    },
  });

  const { data: heroDescription = "", isLoading: heroDescriptionLoading } = useQuery({
    queryKey: ["settings", "hero_description"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("hero_description");
        return setting?.value || "";
      } catch {
        return "";
      }
    },
  });

  const heroSettingsLoading = heroVideoLoading || heroTitleLoading || heroDescriptionLoading;

  const { data: lumaCalendarId = "", isLoading: lumaLoading } = useQuery({
    queryKey: ["settings", "luma_calendar_id"],
    queryFn: async () => {
      try {
        const setting = await settingsAPI.get("luma_calendar_id");
        return setting?.value || "";
      } catch {
        return "";
      }
    },
  });

  // Course mutations
  const createCourseMutation = useMutation({
    mutationFn: async (course: Partial<Course>) => {
      return await coursesAPI.create(course);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course Created", description: "Start adding modules!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Course> }) => {
      return await coursesAPI.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course Updated", description: "Changes saved successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await coursesAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course Deleted", description: "Course removed successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Module mutations
  const createModuleMutation = useMutation({
    mutationFn: async (module: Partial<Module>) => {
      return await modulesAPI.create(module);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Module> }) => {
      return await modulesAPI.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await modulesAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Settings mutations
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await settingsAPI.update(key, value);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings", variables.key] });
      toast({ title: "Saved", description: "Settings updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleCreateCourse = () => {
    createCourseMutation.mutate({
      title: "New Course",
      description: "Course description goes here...",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60",
      isLocked: true,
    });
  };

  const handleUpdateCourse = (id: string, updates: Partial<Course>) => {
    updateCourseMutation.mutate({ id, updates });
  };

  const handleDeleteCourse = (id: string) => {
    deleteCourseMutation.mutate(id);
  };

  const handleReorderCourses = async (courseIds: string[]) => {
    try {
      await coursesAPI.reorder(courseIds);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to reorder courses",
        variant: "destructive"
      });
    }
  };

  const handleSaveCalendly = (url: string) => {
    updateSettingMutation.mutate({ key: "calendly_url", value: url });
  };

  const handleSaveSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  if (userLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="bg-white border-b border-border sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div>
             <h1 className="text-xl font-heading font-bold flex items-center gap-2">
               <Settings className="w-5 h-5 text-primary" />
               Admin Dashboard
             </h1>
             <p className="text-xs text-muted-foreground">Manage content and settings</p>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList className="bg-white p-1 border border-border rounded-xl h-auto w-full grid grid-cols-2 gap-1">
              <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-2.5 text-xs sm:text-sm">
                Courses
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-2.5 text-xs sm:text-sm">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="font-bold text-lg">Your Courses</h2>
                <Button 
                  onClick={handleCreateCourse}
                  disabled={createCourseMutation.isPending}
                >
                  {createCourseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  New Course
                </Button>
              </div>

              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-6">
                  {courses.map(course => (
                    <CourseEditor 
                      key={course.id} 
                      course={course} 
                      onUpdate={handleUpdateCourse}
                      onDelete={handleDeleteCourse}
                      createModuleMutation={createModuleMutation}
                      updateModuleMutation={updateModuleMutation}
                      deleteModuleMutation={deleteModuleMutation}
                      isUpdating={updateCourseMutation.isPending}
                      isDeleting={deleteCourseMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                {heroSettingsLoading ? (
                  <div className="bg-white p-6 rounded-2xl border border-border">
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  </div>
                ) : (
                  <HeroContentSettings 
                    initialVideoId={heroVideoId}
                    initialTitle={heroTitle}
                    initialDescription={heroDescription}
                    onSave={handleSaveSetting}
                    isSaving={updateSettingMutation.isPending}
                  />
                )}

                <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Calendly Integration</h3>
                      <p className="text-xs text-muted-foreground">Manage your booking link</p>
                    </div>
                  </div>
                  
                  {calendlyLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <CalendlySettings 
                      initialUrl={calendlyUrl}
                      onSave={handleSaveCalendly}
                      isSaving={updateSettingMutation.isPending}
                    />
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">AI Test Configuration</h3>
                      <p className="text-xs text-muted-foreground">Powered by OpenAI Responses API</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-800">Connected</span>
                    </div>
                    <p className="text-xs text-green-700">
                      The AI Test is configured using your OpenAI credentials stored securely in Replit Secrets. You can manage your agent behavior directly in the OpenAI platform.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Luma Events</h3>
                      <p className="text-xs text-muted-foreground">Display upcoming PM events from your Luma calendar</p>
                    </div>
                  </div>
                  
                  {lumaLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <LumaSettings 
                      initialCalendarId={lumaCalendarId}
                      onSave={(value) => handleSaveSetting("luma_calendar_id", value)}
                      isSaving={updateSettingMutation.isPending}
                    />
                  )}
                </div>

                <ToolsManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

function CourseEditor({ 
  course, 
  onUpdate, 
  onDelete,
  createModuleMutation,
  updateModuleMutation,
  deleteModuleMutation,
  isUpdating,
  isDeleting
}: { 
  course: Course;
  onUpdate: (id: string, updates: Partial<Course>) => void;
  onDelete: (id: string) => void;
  createModuleMutation: any;
  updateModuleMutation: any;
  deleteModuleMutation: any;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCourse, setEditedCourse] = useState(course);
  const { toast } = useToast();

  useEffect(() => {
    setEditedCourse(course);
  }, [course]);

  const handleSave = async () => {
    const { modules: _, ...courseUpdates } = editedCourse;
    
    await onUpdate(course.id, courseUpdates);
    
    const originalModules = course.modules || [];
    const updatedModules = editedCourse.modules || [];
    
    for (const originalModule of originalModules) {
      if (!updatedModules.find(m => m.id === originalModule.id)) {
        await deleteModuleMutation.mutateAsync(originalModule.id);
      }
    }
    
    for (let i = 0; i < updatedModules.length; i++) {
      const module = updatedModules[i];
      const isNewModule = module.id.startsWith('temp-');
      
      if (isNewModule) {
        await createModuleMutation.mutateAsync({
          courseId: course.id,
          title: module.title,
          duration: module.duration,
          videoId: module.videoId,
          order: i,
        });
      } else {
        await updateModuleMutation.mutateAsync({
          id: module.id,
          updates: {
            title: module.title,
            duration: module.duration,
            videoId: module.videoId,
            order: i,
          },
        });
      }
    }
    
    setIsEditing(false);
  };

  const handleAddModule = () => {
    const newModule: Module = {
      id: `temp-${Date.now()}`,
      courseId: course.id,
      title: "New Module",
      duration: "10:00",
      videoId: "",
      order: (editedCourse.modules?.length || 0),
    };
    setEditedCourse({
      ...editedCourse,
      modules: [...(editedCourse.modules || []), newModule]
    });
  };

  const handleUpdateModule = (index: number, updates: Partial<Module>) => {
    const updatedModules = [...(editedCourse.modules || [])];
    updatedModules[index] = { ...updatedModules[index], ...updates };
    setEditedCourse({ ...editedCourse, modules: updatedModules });
  };

  const handleDeleteModule = (index: number) => {
    const updatedModules = editedCourse.modules?.filter((_, i) => i !== index) || [];
    setEditedCourse({ ...editedCourse, modules: updatedModules });
  };

  const parseYouTubeUrl = (value: string): string => {
    if (!value.includes("youtube.com") && !value.includes("youtu.be")) {
      return value;
    }
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = value.match(regExp);
    
    if (match && match[2].length === 11) {
      return match[2];
    }
    
    return value;
  };

  if (!isEditing) {
    return (
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-24 h-40 sm:h-24 shrink-0 rounded-xl bg-slate-100 overflow-hidden">
          <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="flex justify-between items-start">
             <h3 className="font-bold truncate pr-2">{course.title}</h3>
             <div className="flex gap-1">
               <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
             </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2" dangerouslySetInnerHTML={{__html: course.description}} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center"><Video className="w-3 h-3 mr-1" /> {course.modules?.length || 0} Modules</span>
            <span className="flex items-center"><Star className="w-3 h-3 mr-1" /> {course.rating || "N/A"} Rating</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-primary/20 shadow-lg ring-1 ring-primary/10 space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Course Title</Label>
          <Input 
            value={editedCourse.title} 
            onChange={(e) => setEditedCourse({...editedCourse, title: e.target.value})} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Thumbnail URL</Label>
          <div className="flex gap-2">
            <Input 
              value={editedCourse.thumbnail} 
              onChange={(e) => setEditedCourse({...editedCourse, thumbnail: e.target.value})} 
            />
            <div className="w-10 h-10 rounded bg-slate-100 shrink-0 overflow-hidden border border-border">
              <img src={editedCourse.thumbnail} className="w-full h-full object-cover" alt="" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>About (HTML supported)</Label>
          <Textarea 
            className="h-32"
            value={editedCourse.description} 
            onChange={(e) => setEditedCourse({...editedCourse, description: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <Label>Star Rating (e.g., 4.9)</Label>
          <Input 
            value={editedCourse.rating || ""} 
            onChange={(e) => setEditedCourse({...editedCourse, rating: e.target.value})} 
            placeholder="4.9"
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <Label>Modules</Label>
            <Button size="sm" variant="outline" onClick={handleAddModule}>
              <Plus className="w-3 h-3 mr-1" /> Add Module
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {editedCourse.modules?.map((module, idx) => (
              <div key={module.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-xs font-mono text-muted-foreground w-6 text-center hidden sm:block">{idx + 1}</span>
                <div className="flex-1 space-y-2 w-full">
                  <Input 
                    className="h-9 text-sm bg-white" 
                    value={module.title}
                    onChange={(e) => handleUpdateModule(idx, { title: e.target.value })}
                    placeholder="Module Title"
                  />
                  <div className="flex gap-2">
                     <Input 
                        className="h-8 text-xs bg-white w-20" 
                        value={module.duration}
                        onChange={(e) => handleUpdateModule(idx, { duration: e.target.value })}
                        placeholder="Duration"
                      />
                      <Input 
                        className="h-8 text-xs bg-white flex-1" 
                        value={module.videoId}
                        onChange={(e) => {
                          const videoId = parseYouTubeUrl(e.target.value);
                          handleUpdateModule(idx, { videoId });
                        }}
                        placeholder="YouTube ID or URL"
                      />
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 self-end sm:self-center"
                  onClick={() => handleDeleteModule(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between pt-4 gap-4 sm:gap-0">
          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto" 
            onClick={() => onDelete(course.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete Course
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button 
              className="flex-1 sm:flex-none" 
              onClick={handleSave}
              disabled={isUpdating || createModuleMutation.isPending || updateModuleMutation.isPending || deleteModuleMutation.isPending}
            >
              {(isUpdating || createModuleMutation.isPending || updateModuleMutation.isPending || deleteModuleMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendlySettings({ 
  initialUrl, 
  onSave, 
  isSaving 
}: { 
  initialUrl: string; 
  onSave: (url: string) => void; 
  isSaving: boolean;
}) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  return (
    <div className="space-y-2">
      <Label>Calendly URL</Label>
      <div className="flex gap-2">
        <Input 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://calendly.com/yourname"
        />
        <Button 
          size="icon" 
          onClick={() => onSave(url)}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  linkType: string;
  url: string;
  order: number;
}

function ToolsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Templates",
    linkType: "Google Doc",
    url: "",
    order: 0,
  });

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: toolsAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: toolsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Tool Created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tool> }) =>
      toolsAPI.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Tool Updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: toolsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Tool Deleted" });
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      category: "Templates",
      linkType: "Google Doc",
      url: "",
      order: 0,
    });
  };

  const startEditing = (tool: Tool) => {
    setEditingId(tool.id);
    setIsAdding(false);
    setFormData({
      title: tool.title,
      description: tool.description,
      category: tool.category,
      linkType: tool.linkType,
      url: tool.url,
      order: tool.order,
    });
  };

  const handleSave = () => {
    if (!formData.title || !formData.url) {
      toast({ title: "Error", description: "Title and URL are required", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categories = ["Templates", "Assessment", "Planning", "Frameworks"];
  const linkTypes = ["Google Doc", "Google Sheet", "Notion", "External"];

  return (
    <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Tools Library</h3>
            <p className="text-xs text-muted-foreground">PM templates and frameworks</p>
          </div>
        </div>
        {!isAdding && !editingId && (
          <Button size="sm" onClick={() => setIsAdding(true)} data-testid="button-add-tool">
            <Plus className="w-4 h-4 mr-1" /> Add Tool
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Stakeholder Mapping Template"
                data-testid="input-tool-title"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Map your stakeholders by power and influence"
                data-testid="input-tool-description"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                data-testid="select-tool-category"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Link Type</Label>
              <select
                value={formData.linkType}
                onChange={(e) => setFormData({ ...formData, linkType: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                data-testid="select-tool-linktype"
              >
                {linkTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://docs.google.com/..."
                data-testid="input-tool-url"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm} data-testid="button-cancel-tool">
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-tool"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Save className="w-4 h-4 mr-1" /> Save</>
              )}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No tools yet. Add your first PM template or framework.
        </div>
      ) : (
        <div className="space-y-2">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
              data-testid={`tool-item-${tool.id}`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{tool.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{tool.category}</span>
                  <span className="text-xs text-muted-foreground">{tool.linkType}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => startEditing(tool)}
                  data-testid={`button-edit-tool-${tool.id}`}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => deleteMutation.mutate(tool.id)}
                  data-testid={`button-delete-tool-${tool.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeroContentSettings({ 
  initialVideoId,
  initialTitle,
  initialDescription,
  onSave, 
  isSaving 
}: { 
  initialVideoId: string;
  initialTitle: string;
  initialDescription: string;
  onSave: (key: string, value: string) => void; 
  isSaving: boolean;
}) {
  const [videoId, setVideoId] = useState(initialVideoId);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setVideoId(initialVideoId);
    setTitle(initialTitle);
    setDescription(initialDescription);
  }, [initialVideoId, initialTitle, initialDescription]);

  const handleSaveAll = () => {
    onSave("hero_video_id", videoId);
    onSave("hero_title", title);
    onSave("hero_description", description);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <Video className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold">Hero Content</h3>
          <p className="text-xs text-muted-foreground">Customize the welcome video and text on the home page</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>YouTube Video ID</Label>
          <Input 
            value={videoId} 
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="e.g., dQw4w9WgXcQ"
            data-testid="input-hero-video-id"
          />
          <p className="text-xs text-muted-foreground">
            Enter just the video ID from the YouTube URL (the part after v=)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Hero Title</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Welcome to Product Academy"
            data-testid="input-hero-title"
          />
        </div>

        <div className="space-y-2">
          <Label>Hero Description</Label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Learn Product Management from industry experts..."
            rows={3}
            data-testid="input-hero-description"
          />
        </div>

        <Button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full"
          data-testid="button-save-hero"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Hero Content
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function LumaSettings({ 
  initialCalendarId, 
  onSave, 
  isSaving 
}: { 
  initialCalendarId: string; 
  onSave: (id: string) => void; 
  isSaving: boolean;
}) {
  const [calendarId, setCalendarId] = useState(initialCalendarId);

  useEffect(() => {
    setCalendarId(initialCalendarId);
  }, [initialCalendarId]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Luma Calendar API ID</Label>
        <div className="flex gap-2">
          <Input 
            value={calendarId} 
            onChange={(e) => setCalendarId(e.target.value)}
            placeholder="cal-xxxxxxxxxx"
            data-testid="input-luma-calendar-id"
          />
          <Button 
            size="icon" 
            onClick={() => onSave(calendarId)}
            disabled={isSaving}
            data-testid="button-save-luma"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Find your Calendar API ID in your Luma calendar settings under the API section.
        </p>
      </div>
      
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          <strong>Note:</strong> You also need to add your LUMA_API_KEY as a secret in your Replit environment. Get your API key from lu.ma/settings/integrations.
        </p>
      </div>
    </div>
  );
}
