import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Plus, X, User, Briefcase, Upload } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { User as SelectUser, Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const userId = id ? parseInt(id) : currentUser?.id;
  const isOwnProfile = userId === currentUser?.id;

  const { data: user, isLoading: userLoading } = useQuery<SelectUser>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  const { data: userProjects, isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/users", userId, "projects"],
    enabled: !!userId,
  });

  const [editedData, setEditedData] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    skills: user?.skills || [],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/users/${userId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      setIsEditing(false);
      toast({ title: "تم تحديث الملف الشخصي بنجاح" });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(editedData);
  };

  const addSkill = () => {
    if (newSkill.trim() && !editedData.skills.includes(newSkill.trim())) {
      setEditedData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setEditedData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          <Skeleton className="h-48 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        value={editedData.fullName}
                        onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">نبذة مختصرة</Label>
                      <Textarea
                        id="bio"
                        value={editedData.bio}
                        onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                        placeholder="أخبرنا عن نفسك..."
                        className="min-h-[100px]"
                        data-testid="textarea-edit-bio"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h1 className="text-3xl font-bold">{user?.fullName}</h1>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                    {user?.bio && (
                      <p className="text-sm">{user.bio}</p>
                    )}
                  </>
                )}

                {/* Actions */}
                {isOwnProfile && (
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                          حفظ التغييرات
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          إلغاء
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                        <Edit2 className="ml-2 h-4 w-4" />
                        تعديل الملف الشخصي
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              المهارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="أضف مهارة جديدة..."
                    data-testid="input-add-skill"
                  />
                  <Button onClick={addSkill} data-testid="button-add-skill">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.skills && user.skills.length > 0 ? (
                  user.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد مهارات مضافة</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              المشاريع ({userProjects?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : userProjects && userProjects.length > 0 ? (
              <div className="grid gap-4">
                {userProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="p-4 border rounded-lg hover-elevate cursor-pointer" data-testid={`user-project-${project.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{project.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                        <Badge variant={project.status === "active" ? "default" : "secondary"}>
                          {project.status === "active" ? "نشط" : "مكتمل"}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا توجد مشاريع بعد
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
