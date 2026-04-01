import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Search,
  Eye,
  Shield,
  ShieldOff,
  Users,
  BookOpen,
  Target,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import type { User } from "@shared/schema";

interface UserDetails {
  user: User;
  moduleProgress: any[];
  lessonProgress: any[];
  exerciseResponses: any[];
  practiceLogs: any[];
  certaintyRatings: any[];
  gridScores: any[];
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: userDetails, isLoading: detailsLoading } = useQuery<UserDetails>({
    queryKey: ['/api/admin/users', selectedUserId],
    enabled: !!selectedUserId,
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      return apiRequest('PATCH', `/api/admin/users/${id}`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter(user => {
    const searchLower = search.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse w-64" />
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">View and manage all registered users</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {users?.length || 0} users
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isAdmin}
                      onCheckedChange={(checked) => toggleAdminMutation.mutate({ id: user.id, isAdmin: checked })}
                      data-testid={`switch-admin-${user.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUserId(user.id)}
                      data-testid={`button-view-user-${user.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {userDetails?.user && (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userDetails.user.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {userDetails.user.firstName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{userDetails.user.firstName} {userDetails.user.lastName}</p>
                      <p className="text-sm font-normal text-muted-foreground">{userDetails.user.email}</p>
                    </div>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 pt-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>This data is private. Handle with care.</span>
              </DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading user details...</div>
            ) : userDetails && (
              <Tabs defaultValue="progress" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="practice">Practice</TabsTrigger>
                  <TabsTrigger value="certainty">Certainty</TabsTrigger>
                  <TabsTrigger value="exercises">Exercises</TabsTrigger>
                </TabsList>

                <TabsContent value="progress" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Module Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetails.moduleProgress.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No module progress</p>
                      ) : (
                        <div className="space-y-2">
                          {userDetails.moduleProgress.map((mp: any) => (
                            <div key={mp.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <span>Module {mp.moduleId}</span>
                              <Badge variant={mp.isCompleted ? "default" : "secondary"}>
                                {mp.isCompleted ? "Completed" : "In Progress"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="practice" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Recent Practice ({userDetails.practiceLogs.length} sessions)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetails.practiceLogs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No practice sessions</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userDetails.practiceLogs.slice(0, 10).map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <span className="text-sm">{formatDate(log.practiceDate)}</span>
                              <div className="flex items-center gap-2">
                                {log.gridScore && <Badge variant="outline">Grid: {log.gridScore}</Badge>}
                                <Badge variant={log.isFullyCompleted ? "default" : "secondary"}>
                                  {log.isFullyCompleted ? "Complete" : "Partial"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="certainty" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Certainty Ratings ({userDetails.certaintyRatings.length} ratings)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetails.certaintyRatings.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No certainty ratings</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userDetails.certaintyRatings.slice(0, 10).map((rating: any) => (
                            <div key={rating.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <span className="text-sm">{formatDate(rating.ratingDate)}</span>
                              <Badge variant={rating.rating >= 7 ? "default" : "destructive"}>
                                {rating.rating}/10
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="exercises" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Exercise Responses ({userDetails.exerciseResponses.length})</CardTitle>
                      <CardDescription>User's submitted exercise responses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userDetails.exerciseResponses.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No exercise responses</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userDetails.exerciseResponses.slice(0, 10).map((ex: any) => (
                            <div key={ex.id} className="p-2 rounded bg-muted/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Exercise {ex.exerciseId}</span>
                                <Badge variant={ex.isCompleted ? "default" : "secondary"}>
                                  {ex.isCompleted ? "Completed" : "In Progress"}
                                </Badge>
                              </div>
                              {ex.response && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {ex.response.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
