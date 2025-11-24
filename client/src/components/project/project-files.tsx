import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, File, Download, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { File as FileType } from "@shared/schema";

interface ProjectFilesProps {
  projectId: number;
}

export function ProjectFiles({ projectId }: ProjectFilesProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: files, isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "files"],
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId.toString());
      formData.append("uploadedById", user?.id?.toString() || "");

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("فشل رفع الملف");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      toast({ title: "تم رفع الملف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل رفع الملف", variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الملفات</CardTitle>
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
        <CardTitle>الملفات</CardTitle>
        <Button asChild size="sm">
          <label className="cursor-pointer">
            <Upload className="ml-2 h-4 w-4" />
            رفع ملف
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadFileMutation.isPending}
              data-testid="input-file-upload"
            />
          </label>
        </Button>
      </CardHeader>
      <CardContent>
        {files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                data-testid={`file-${file.id}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.fileName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{file.uploadedBy?.fullName}</span>
                      <span>•</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString("ar-EG")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={file.fileUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <File className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">لا توجد ملفات بعد</p>
            <Button asChild size="sm">
              <label className="cursor-pointer">
                <Upload className="ml-2 h-4 w-4" />
                رفع أول ملف
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadFileMutation.isPending}
                />
              </label>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
