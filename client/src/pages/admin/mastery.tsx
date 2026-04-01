import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Flame,
  BookOpen,
  Grid3X3,
  Target,
  Loader2,
} from "lucide-react";

interface MasterySubmission {
  id: string;
  userId: string;
  requirementId: string;
  status: string;
  evidence: string | null;
  fileUrl: string | null;
  verificationFeedback: string | null;
  revisionCount: number;
  submittedAt: string | null;
  requirementTitle?: string;
  moduleId?: number;
  userName?: string;
}

const getTypeIcon = (title: string) => {
  if (title?.toLowerCase().includes('lesson')) return BookOpen;
  if (title?.toLowerCase().includes('template') || title?.toLowerCase().includes('submit')) return FileText;
  if (title?.toLowerCase().includes('streak')) return Flame;
  if (title?.toLowerCase().includes('grid')) return Grid3X3;
  if (title?.toLowerCase().includes('assessment') || title?.toLowerCase().includes('reflection')) return Target;
  return Shield;
};

export default function AdminMastery() {
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<MasterySubmission | null>(null);
  const [feedback, setFeedback] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");

  const { data: submissions = [], isLoading } = useQuery<MasterySubmission[]>({
    queryKey: ['/api/admin/mastery/submissions', filterStatus],
    queryFn: async () => {
      const res = await fetch(`/api/admin/mastery/submissions?status=${filterStatus}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, verificationFeedback }: { id: string; status: string; verificationFeedback: string }) => {
      return apiRequest('PATCH', `/api/admin/mastery/submissions/${id}`, { status, verificationFeedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mastery/submissions'] });
      setSelectedSubmission(null);
      setFeedback("");
      toast({ title: "Updated", description: "Submission status updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update submission.", variant: "destructive" });
    },
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-mastery-title">Mastery Submissions</h1>
          <p className="text-muted-foreground">Review and verify student mastery evidence</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-pending-count">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{submissions.filter(s => s.status === 'verified').length}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{submissions.filter(s => s.status === 'rejected').length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
            <TabsTrigger value="verified" data-testid="tab-verified">Verified</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus}>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : submissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No {filterStatus} submissions found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((sub) => {
                        const Icon = getTypeIcon(sub.requirementTitle || '');
                        return (
                          <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                            <TableCell className="font-medium">{sub.userName || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span>{sub.requirementTitle || sub.requirementId}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Module {sub.moduleId}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={sub.status === 'verified' || sub.status === 'auto_verified' ? 'default' : sub.status === 'rejected' ? 'destructive' : 'secondary'}
                                className={sub.status === 'verified' || sub.status === 'auto_verified' ? 'bg-green-600 text-white' : ''}
                              >
                                {sub.status === 'auto_verified' ? 'Auto-Verified' : sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setFeedback(sub.verificationFeedback || "");
                                }}
                                data-testid={`button-review-${sub.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => { if (!open) setSelectedSubmission(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.requirementTitle} - {selectedSubmission?.userName}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Module</p>
                <Badge variant="outline">Module {selectedSubmission.moduleId}</Badge>
              </div>

              {selectedSubmission.evidence && (
                <div>
                  <p className="text-sm font-medium mb-1">Evidence / Response</p>
                  <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap max-h-60 overflow-auto">
                    {selectedSubmission.evidence}
                  </div>
                </div>
              )}

              {selectedSubmission.fileUrl && (
                <div>
                  <p className="text-sm font-medium mb-1">Attached File</p>
                  <a href={selectedSubmission.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      View File
                    </Button>
                  </a>
                </div>
              )}

              {selectedSubmission.revisionCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Revision #{selectedSubmission.revisionCount}
                </p>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Feedback</p>
                <Textarea
                  placeholder="Provide feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-feedback"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    verifyMutation.mutate({
                      id: selectedSubmission.id,
                      status: 'rejected',
                      verificationFeedback: feedback,
                    });
                  }}
                  disabled={verifyMutation.isPending}
                  data-testid="button-reject"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    verifyMutation.mutate({
                      id: selectedSubmission.id,
                      status: 'verified',
                      verificationFeedback: feedback,
                    });
                  }}
                  disabled={verifyMutation.isPending}
                  data-testid="button-verify"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  Verify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
