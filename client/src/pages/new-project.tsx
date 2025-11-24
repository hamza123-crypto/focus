import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const POPULAR_SKILLS = ["React", "Node.js", "Python", "Design", "Marketing", "Data Science", "Mobile", "AI/ML"];

export default function NewProject() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    isPublic: true,
    requiredSkills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState("");

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/projects", {
        ...data,
        creatorId: user?.id,
      });
      return await res.json();
    },
    onSuccess: (project) => {
      toast({ title: "تم إنشاء المشروع بنجاح" });
      setLocation(`/projects/${project.id}`);
    },
    onError: () => {
      toast({ title: "فشل إنشاء المشروع", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectData.name.trim() && projectData.description.trim()) {
      createProjectMutation.mutate(projectData);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !projectData.requiredSkills.includes(skill)) {
      setProjectData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setProjectData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  const addCustomSkill = () => {
    if (newSkill.trim()) {
      addSkill(newSkill.trim());
      setNewSkill("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">إنشاء مشروع جديد</h1>
          <p className="text-muted-foreground">ابدأ مشروعك وابحث عن فريق مناسب</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المشروع</CardTitle>
              <CardDescription>أضف المعلومات الأساسية لمشروعك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">اسم المشروع *</Label>
                <Input
                  id="project-name"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  placeholder="مثال: تطبيق إدارة المهام"
                  required
                  data-testid="input-project-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">وصف المشروع *</Label>
                <Textarea
                  id="project-description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  placeholder="صف مشروعك بالتفصيل، ما هو الهدف منه وما الذي سيحققه..."
                  className="min-h-[120px]"
                  required
                  data-testid="textarea-project-description"
                />
              </div>

              <div className="space-y-3">
                <Label>المهارات المطلوبة</Label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.map(skill => (
                    <Badge
                      key={skill}
                      variant={projectData.requiredSkills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer hover-elevate"
                      onClick={() => {
                        if (projectData.requiredSkills.includes(skill)) {
                          removeSkill(skill);
                        } else {
                          addSkill(skill);
                        }
                      }}
                      data-testid={`skill-badge-${skill}`}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                    placeholder="أضف مهارة أخرى..."
                    data-testid="input-custom-skill"
                  />
                  <Button type="button" onClick={addCustomSkill} data-testid="button-add-skill">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {projectData.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {projectData.requiredSkills.map(skill => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public-project">مشروع عام</Label>
                  <p className="text-sm text-muted-foreground">
                    السماح لأي شخص برؤية المشروع والانضمام إليه
                  </p>
                </div>
                <Switch
                  id="public-project"
                  checked={projectData.isPublic}
                  onCheckedChange={(checked) => setProjectData({ ...projectData, isPublic: checked })}
                  data-testid="switch-public-project"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!projectData.name.trim() || !projectData.description.trim() || createProjectMutation.isPending}
                  className="flex-1"
                  data-testid="button-create-project"
                >
                  إنشاء المشروع
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
