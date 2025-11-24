import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Filter, UserPlus, ThumbsUp, MessageCircle, Send, Bell } from "lucide-react";
import { Link } from "wouter";
import type { Project, Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const SKILLS = ["React", "Node.js", "Python", "Design", "Marketing", "Data Science", "Mobile", "AI/ML"];

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [commentContent, setCommentContent] = useState<{ [key: number]: string }>({});

  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects/public"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/posts"],
  });

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const joinProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await apiRequest("POST", "/api/join-request", { projectId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/public"] });
      toast({ title: "تم إرسال طلب الانضمام" });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/comments", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentContent({});
      toast({ title: "تم إضافة التعليق بنجاح" });
    },
  });

  const handleAddComment = (postId: number) => {
    const content = commentContent[postId];
    if (content && content.trim()) {
      createCommentMutation.mutate({ postId, content });
    }
  };

  const handleLikePost = (postId: number) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => project.requiredSkills?.includes(skill));
    return matchesSearch && matchesSkills;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">استكشف المشاريع</h1>
                <p className="text-muted-foreground">اكتشف مشاريع جديدة وانضم إلى فرق العمل</p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-2xl">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="ابحث عن مشاريع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-projects"
                />
              </div>

              {/* Skill Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">فلتر حسب المهارات:</span>
                {SKILLS.map(skill => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer hover-elevate"
                    onClick={() => toggleSkill(skill)}
                    data-testid={`filter-skill-${skill}`}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover-elevate" data-testid={`public-project-${project.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">عام</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{project.members?.length || 0} أعضاء</span>
                      </div>
                      {user && (
                        <Button 
                          size="sm" 
                          className="w-full gap-2"
                          onClick={() => joinProjectMutation.mutate(project.id)}
                          disabled={joinProjectMutation.isPending}
                          data-testid={`button-join-project-${project.id}`}
                        >
                          <UserPlus className="h-4 w-4" />
                          طلب الانضمام
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground mb-4">لم يتم العثور على مشاريع</p>
                  {user && (
                    <Button asChild>
                      <Link href="/projects/new">إنشاء مشروع جديد</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            <div className="space-y-4 mt-8">
              <h2 className="text-xl font-bold">آخر التحديثات</h2>
              {postsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : posts && posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="hover-elevate" data-testid={`post-${post.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author?.avatarUrl} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {post.author?.fullName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{post.author?.fullName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString("ar-EG")}</p>
                        </div>
                      </div>
                      <p className="text-foreground">{post.content}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleLikePost(post.id)}
                          data-testid={`button-like-post-${post.id}`}
                        >
                          <ThumbsUp className={`h-4 w-4 ${likedPosts.has(post.id) ? "fill-current text-primary" : ""}`} />
                          <span className="text-xs">{likedPosts.has(post.id) ? "معجب" : "إعجاب"}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-comment-post-${post.id}`}>
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-xs">تعليق ({post.comments?.length || 0})</span>
                        </Button>
                      </div>

                      {/* Comments Section */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          {post.comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-2" data-testid={`comment-${comment.id}`}>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={comment.author?.avatarUrl} />
                                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                  {comment.author?.fullName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted p-2 rounded">
                                <p className="text-xs font-medium">{comment.author?.fullName}</p>
                                <p className="text-xs text-foreground">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input */}
                      {user && (
                        <div className="flex gap-2 pt-2">
                          <Input
                            placeholder="أضف تعليقاً..."
                            value={commentContent[post.id] || ""}
                            onChange={(e) => setCommentContent({ ...commentContent, [post.id]: e.target.value })}
                            className="text-xs h-8"
                            data-testid={`input-comment-${post.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentContent[post.id]?.trim() || createCommentMutation.isPending}
                            data-testid={`button-add-comment-${post.id}`}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    لا توجد تحديثات بعد
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            {notifications && notifications.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    الإشعارات
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">{notifications.filter(n => !n.isRead).length}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((notif: any) => (
                      <div key={notif.id} className="p-2 bg-muted rounded text-sm" data-testid={`notification-${notif.id}`}>
                        <p className="font-medium text-xs">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString("ar-EG")}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
