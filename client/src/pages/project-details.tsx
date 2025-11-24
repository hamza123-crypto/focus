import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Users, MessageSquare, Layout, FileText, CheckSquare, Pencil } from "lucide-react";
import { KanbanBoard } from "@/components/project/kanban-board";
import { ProjectChat } from "@/components/project/project-chat";
import { ProjectWhiteboard } from "@/components/project/project-whiteboard";
import { ProjectFiles } from "@/components/project/project-files";
import { ProjectTeam } from "@/components/project/project-team";
import { ProjectTasks } from "@/components/project/project-tasks";
import type { Project } from "@shared/schema";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id!);

  const { data: project, isLoading } = useQuery<any>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-32 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">المشروع غير موجود</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Project Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{project.name}</CardTitle>
                  <Badge variant={project.status === "active" ? "default" : "secondary"}>
                    {project.status === "active" ? "نشط" : "مكتمل"}
                  </Badge>
                </div>
                <CardDescription className="text-base">{project.description}</CardDescription>
              </div>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Project Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 h-auto">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2" data-testid="tab-tasks">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">المهام</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2" data-testid="tab-kanban">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">كانبان</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2" data-testid="tab-chat">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">الشات</span>
            </TabsTrigger>
            <TabsTrigger value="whiteboard" className="gap-2" data-testid="tab-whiteboard">
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">الوايت بورد</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2" data-testid="tab-files">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">الملفات</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2" data-testid="tab-team">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">الفريق</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل المشروع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">المنشئ</p>
                    <p className="font-medium">{project.creator?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">تاريخ الإنشاء</p>
                    <p className="font-medium">{new Date(project.createdAt).toLocaleDateString("ar-EG")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">عدد الأعضاء</p>
                    <p className="font-medium">{project.members?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>المهارات المطلوبة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills && project.requiredSkills.length > 0 ? (
                      project.requiredSkills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">لا توجد مهارات محددة</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <ProjectTasks projectId={projectId} />
          </TabsContent>

          <TabsContent value="kanban">
            <KanbanBoard projectId={projectId} />
          </TabsContent>

          <TabsContent value="chat">
            <ProjectChat projectId={projectId} />
          </TabsContent>

          <TabsContent value="whiteboard">
            <ProjectWhiteboard projectId={projectId} />
          </TabsContent>

          <TabsContent value="files">
            <ProjectFiles projectId={projectId} />
          </TabsContent>

          <TabsContent value="team">
            <ProjectTeam projectId={projectId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
