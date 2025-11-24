import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Clock, CheckCircle2, Users, UserPlus, ThumbsUp, MessageCircle, Send, Bell, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Project, Post, Task } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", priority: "medium" });
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [commentContent, setCommentContent] = useState<{ [key: number]: string }>({});

  const { data: projects, isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/projects/my"],
  });

  const { data: publicProjects } = useQuery<any[]>({
    queryKey: ["/api/projects/public"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/posts"],
  });

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/posts", { content });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      toast({ title: "تم نشر المنشور بنجاح" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      setIsAddTaskDialogOpen(false);
      setNewTask({ title: "", priority: "medium" });
      toast({ title: "تمت إضافة المهمة بنجاح" });
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

  const acceptJoinRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("POST", `/api/join-request/${requestId}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/public"] });
      toast({ title: "تم قبول طلب الانضمام" });
    },
  });

  const rejectJoinRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("POST", `/api/join-request/${requestId}/reject`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "تم رفض طلب الانضمام" });
    },
  });

  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      createPostMutation.mutate(newPostContent);
    }
  };

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      createTaskMutation.mutate({
        title: newTask.title,
        priority: newTask.priority,
        status: "todo",
        projectId: projects?.[0]?.id || 1,
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">مرحباً، {user?.fullName}</h1>
          <p className="text-muted-foreground">ما الذي ستنجزه اليوم؟</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover-elevate">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">المشاريع النشطة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{projects?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">المهام المعلقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold">
                      {tasks?.filter(t => t.status !== "done").length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">المهام المكتملة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">
                      {tasks?.filter(t => t.status === "done").length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle>مشاريعي</CardTitle>
                <Button asChild size="sm">
                  <Link href="/projects/new">
                    <Plus className="ml-2 h-4 w-4" />
                    مشروع جديد
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <Skeleton className="h-20" />
                ) : projects && projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="p-4 border rounded-lg hover-elevate cursor-pointer" data-testid={`my-project-${project.id}`}>
                          <h3 className="font-semibold mb-1">{project.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <Badge variant={project.status === "active" ? "default" : "secondary"}>
                              {project.status === "active" ? "نشط" : "مكتمل"}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{project.members?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">لا توجد مشاريع بعد</p>
                )}
              </CardContent>
            </Card>

            {/* Public Projects */}
            {publicProjects && publicProjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    المشاريع العامة للانضمام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicProjects.map((project) => (
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create Post */}
            <Card>
              <CardHeader>
                <CardTitle>شارك تحديثاً</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="ما الجديد؟ شارك إنجازاتك أو أفكارك..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[100px] resize-none"
                  data-testid="textarea-new-post"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || createPostMutation.isPending}
                    data-testid="button-create-post"
                  >
                    <Send className="ml-2 h-4 w-4" />
                    نشر
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
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
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.map((notif: any) => (
                      <div key={notif.id} className="p-3 bg-muted rounded text-sm border" data-testid={`notification-${notif.id}`}>
                        <p className="font-medium text-xs mb-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mb-2">{new Date(notif.createdAt).toLocaleString("ar-EG")}</p>
                        {notif.type === "join_request" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 h-7 gap-1"
                              onClick={() => acceptJoinRequestMutation.mutate(notif.projectId)}
                              disabled={acceptJoinRequestMutation.isPending}
                              data-testid={`button-accept-request-${notif.id}`}
                            >
                              <Check className="h-3 w-3" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 gap-1"
                              onClick={() => rejectJoinRequestMutation.mutate(notif.projectId)}
                              disabled={rejectJoinRequestMutation.isPending}
                              data-testid={`button-reject-request-${notif.id}`}
                            >
                              <X className="h-3 w-3" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">مهامي القادمة</CardTitle>
                <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid="button-add-upcoming-task">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="task-title">العنوان</Label>
                        <Input
                          id="task-title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="ما المهمة؟"
                          data-testid="input-task-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-priority">الأولوية</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                        >
                          <SelectTrigger id="task-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleAddTask}
                        disabled={!newTask.title.trim() || createTaskMutation.isPending}
                        className="w-full"
                        data-testid="button-add-task-confirm"
                      >
                        إضافة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <Skeleton className="h-32" />
                ) : tasks && tasks.filter(t => t.status !== "done").length > 0 ? (
                  <div className="space-y-2">
                    {tasks.filter(t => t.status !== "done").slice(0, 5).map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg text-sm hover-elevate" data-testid={`upcoming-task-${task.id}`}>
                        <p className="font-medium line-clamp-1">{task.title}</p>
                        <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {task.priority === "high" ? "عالية" : task.priority === "medium" ? "متوسطة" : "منخفضة"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.status === "in_progress" ? "قيد التنفيذ" : "معلقة"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">لا توجد مهام قادمة</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
