import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, User } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface KanbanBoardProps {
  projectId: number;
}

const COLUMNS = [
  { id: "todo", title: "قائمة المهام", color: "bg-blue-500" },
  { id: "in_progress", title: "قيد التنفيذ", color: "bg-orange-500" },
  { id: "done", title: "منتهية", color: "bg-green-500" },
];

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { toast } = useToast();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", projectId, "tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; status: string }) => {
      const res = await apiRequest("POST", "/api/tasks", {
        projectId,
        title: data.title,
        status: data.status,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      setNewTaskTitle("");
      setActiveColumn(null);
      toast({ title: "تمت إضافة المهمة بنجاح" });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/tasks/${taskId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    updateTaskStatusMutation.mutate({ taskId, status });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddTask = (status: string) => {
    if (newTaskTitle.trim()) {
      createTaskMutation.mutate({ title: newTaskTitle, status });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map(col => (
          <Skeleton key={col.id} className="h-96" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map(column => {
        const columnTasks = tasks?.filter(task => task.status === column.id) || [];

        return (
          <Card
            key={column.id}
            className="flex flex-col"
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
            data-testid={`kanban-column-${column.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                <CardTitle className="text-lg">{column.title}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {columnTasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="p-3 border rounded-lg bg-card cursor-move hover-elevate active-elevate-2"
                  data-testid={`task-card-${task.id}`}
                >
                  <h4 className="font-medium mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.priority && (
                      <Badge
                        variant={
                          task.priority === "high" ? "destructive" :
                          task.priority === "medium" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority === "high" ? "عالية" : 
                         task.priority === "medium" ? "متوسطة" : "منخفضة"}
                      </Badge>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(task.dueDate).toLocaleDateString("ar-EG")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Task */}
              {activeColumn === column.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="عنوان المهمة..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTask(column.id)}
                    autoFocus
                    data-testid={`input-new-task-${column.id}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddTask(column.id)}
                      disabled={!newTaskTitle.trim()}
                      data-testid={`button-add-task-${column.id}`}
                    >
                      إضافة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveColumn(null);
                        setNewTaskTitle("");
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setActiveColumn(column.id)}
                  data-testid={`button-show-add-task-${column.id}`}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة مهمة
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
