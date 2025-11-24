import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Crown, Shield, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ProjectTeamProps {
  projectId: number;
}

export function ProjectTeam({ projectId }: ProjectTeamProps) {
  const { toast } = useToast();

  const { data: members, isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "members"],
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "المالك";
      case "admin":
        return "مشرف";
      default:
        return "عضو";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الفريق</CardTitle>
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
        <CardTitle>الفريق ({members?.length || 0})</CardTitle>
        <Button size="sm" data-testid="button-invite-member">
          <UserPlus className="ml-2 h-4 w-4" />
          دعوة عضو
        </Button>
      </CardHeader>
      <CardContent>
        {members && members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <Link key={member.id} href={`/profile/${member.user?.id}`}>
                <div
                  className="flex items-center gap-4 p-3 border rounded-lg hover-elevate cursor-pointer"
                  data-testid={`member-${member.id}`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.user?.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.user?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{member.user?.fullName}</p>
                      <Badge variant="outline" className="gap-1">
                        {getRoleIcon(member.role)}
                        <span className="text-xs">{getRoleLabel(member.role)}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                    {member.user?.skills && member.user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.user.skills.slice(0, 3).map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      انضم في {new Date(member.joinedAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">لا يوجد أعضاء في الفريق بعد</p>
            <Button size="sm">
              <UserPlus className="ml-2 h-4 w-4" />
              دعوة أعضاء
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
