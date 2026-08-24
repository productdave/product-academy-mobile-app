import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { toolsAPI, coursesAPI } from "@/lib/api";
import { FolderOpen, Loader2, FileText, Table, Link2, ChevronRight, PlayCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  linkType: string;
  url: string;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

export default function ResourcesPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"courses" | "templates">("courses");

  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: toolsAPI.getAll,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: coursesAPI.getAll,
  });

  const isLoading = toolsLoading || coursesLoading;

  const getLinkTypeIcon = (linkType: string) => {
    switch (linkType.toLowerCase()) {
      case "google doc":
        return <FileText className="w-4 h-4" />;
      case "google sheet":
        return <Table className="w-4 h-4" />;
      default:
        return <Link2 className="w-4 h-4" />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background" data-testid="resources-page">
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background px-6 py-8">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold" data-testid="text-resources-title">Resources</h1>
                <p className="text-sm text-muted-foreground" data-testid="text-resources-subtitle">Courses & templates for PM success</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={activeTab === "courses" ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-1"
                onClick={() => setActiveTab("courses")}
                data-testid="button-tab-courses"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Courses
              </Button>
              <Button
                variant={activeTab === "templates" ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-1"
                onClick={() => setActiveTab("templates")}
                data-testid="button-tab-templates"
              >
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 max-w-lg mx-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16" data-testid="status-resources-loading">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          )}

          {!isLoading && activeTab === "courses" && (
            <>
              {courses.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center" data-testid="status-courses-empty">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-700 mb-2">No Courses Yet</h3>
                  <p className="text-sm text-slate-600">Check back soon for PM courses!</p>
                </div>
              ) : (
                <div className="space-y-3" data-testid="list-courses">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => navigate(`/course/${course.id}`)}
                      data-testid={`course-card-${course.id}`}
                    >
                      <div className="flex">
                        <div className="w-24 h-24 shrink-0 relative">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors truncate" data-testid={`text-course-title-${course.id}`}>
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-course-description-${course.id}`}>
                            {course.description}
                          </p>
                        </div>
                        <div className="flex items-center pr-4">
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!isLoading && activeTab === "templates" && (
            <>
              {tools.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center" data-testid="status-templates-empty">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-700 mb-2">No Templates Yet</h3>
                  <p className="text-sm text-slate-600">Check back soon for PM templates and frameworks!</p>
                </div>
              ) : (
                <div className="space-y-3" data-testid="list-templates">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => window.open(tool.url, "_blank")}
                      data-testid={`template-card-${tool.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          {getLinkTypeIcon(tool.linkType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors" data-testid={`text-template-title-${tool.id}`}>
                            {tool.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-template-description-${tool.id}`}>
                            {tool.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-md" data-testid={`text-template-category-${tool.id}`}>
                              {tool.category}
                            </span>
                            <span className="text-xs text-muted-foreground" data-testid={`text-template-type-${tool.id}`}>
                              {tool.linkType}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
