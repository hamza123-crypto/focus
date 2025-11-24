import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Calendar, User } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface ProjectTasksProps {
  projectId: number;
}

export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
  });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", projectId, "tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tasks", {
        ...data,
        projectId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      setIsDialogOpen(false);
      setNewTask({ title: "", description: "", priority: "medium", status: "todo" });
      toast({ title: "تمت إضافة المهمة بنجاح" });
    },
  });

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      createTaskMutation.mutate(newTask);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المهام</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>المهام ({tasks?.length || 0})</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-new-task">
              <Plus className="ml-2 h-4 w-4" />
              مهمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
              <DialogDescription>أضف مهمة جديدة للمشروع</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="task-title">العنوان *</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="عنوان المهمة..."
                  data-testid="input-task-title"
                />
              </div>
              <div>
                <Label htmlFor="task-description">الوصف</Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="وصف المهمة..."
                  className="min-h-[100px]"
                  data-testid="textarea-task-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-priority">الأولوية</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger id="task-priority" data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task-status">الحالة</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                  >
                    <SelectTrigger id="task-status" data-testid="select-task-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">قائمة المهام</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="done">منتهية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCreateTask}
                disabled={!newTask.title.trim() || createTaskMutation.isPending}
                className="w-full"
                data-testid="button-create-task"
              >
                إنشاء المهمة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg hover-elevate"
                data-testid={`task-item-${task.id}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold flex-1">{task.title}</h3>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        task.status === "done" ? "default" :
                        task.status === "in_progress" ? "secondary" : "outline"
                      }
                    >
                      {task.status === "done" ? "منتهية" :
                       task.status === "in_progress" ? "قيد التنفيذ" : "معلقة"}
                    </Badge>
                    <Badge
                      variant={
                        task.priority === "high" ? "destructive" :
                        task.priority === "medium" ? "default" : "secondary"
                      }
                    >
                      {task.priority === "high" ? "عالية" :
                       task.priority === "medium" ? "متوسطة" : "منخفضة"}
                    </Badge>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(task.dueDate).toLocaleDateString("ar-EG")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">لا توجد مهام بعد</p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة أول مهمة
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
