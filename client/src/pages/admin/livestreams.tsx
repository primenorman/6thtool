import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Radio, Play, Pencil, Trash2, Calendar, Clock } from "lucide-react";
import type { Livestream } from "@shared/schema";

interface LivestreamForm {
  title: string;
  description: string;
  embedUrl: string;
  recordingUrl: string;
  thumbnailUrl: string;
  status: "scheduled" | "live" | "ended";
  scheduledAt: string;
}

const emptyForm: LivestreamForm = {
  title: "",
  description: "",
  embedUrl: "",
  recordingUrl: "",
  thumbnailUrl: "",
  status: "scheduled",
  scheduledAt: "",
};

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminLivestreams() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LivestreamForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: streams, isLoading } = useQuery<Livestream[]>({
    queryKey: ["/api/livestreams"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: LivestreamForm) => {
      return apiRequest("POST", "/api/admin/livestreams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast({ title: "Livestream created" });
    },
    onError: () => toast({ title: "Failed to create livestream", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LivestreamForm> }) => {
      return apiRequest("PATCH", `/api/admin/livestreams/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: "Livestream updated" });
    },
    onError: () => toast({ title: "Failed to update livestream", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/livestreams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
      setDeleteConfirm(null);
      toast({ title: "Livestream deleted" });
    },
    onError: () => toast({ title: "Failed to delete livestream", variant: "destructive" }),
  });

  const goLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/livestreams/${id}`, { status: "live" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
      toast({ title: "You're live!" });
    },
  });

  const endStreamMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/livestreams/${id}`, { status: "ended" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
      toast({ title: "Stream ended" });
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(stream: Livestream) {
    setEditingId(stream.id);
    setForm({
      title: stream.title,
      description: stream.description || "",
      embedUrl: stream.embedUrl || "",
      recordingUrl: stream.recordingUrl || "",
      thumbnailUrl: stream.thumbnailUrl || "",
      status: stream.status as "scheduled" | "live" | "ended",
      scheduledAt: stream.scheduledAt ? new Date(stream.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "live": return <Radio className="w-3 h-3" />;
      case "ended": return <Play className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const statusVariant = (status: string): "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "live": return "destructive";
      case "ended": return "secondary";
      default: return "outline";
    }
  };

  const liveStreams = streams?.filter(s => s.status === "live") || [];
  const scheduledStreams = streams?.filter(s => s.status === "scheduled") || [];
  const endedStreams = streams?.filter(s => s.status === "ended") || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-admin-livestreams-title">Livestreams</h2>
            <p className="text-muted-foreground">Manage live workshops and recordings</p>
          </div>
          <Button onClick={openCreate} data-testid="button-create-livestream">
            <Plus className="w-4 h-4 mr-2" />
            New Livestream
          </Button>
        </div>

        <div className="grid grid-cols-1 twohanded:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
                <Radio className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{liveStreams.length}</p>
                <p className="text-xs text-muted-foreground">Live Now</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledStreams.length}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                <Play className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{endedStreams.length}</p>
                <p className="text-xs text-muted-foreground">Recordings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : !streams || streams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No livestreams yet. Create your first one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {streams.map((stream) => (
              <Card key={stream.id} data-testid={`card-admin-stream-${stream.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{stream.title}</h3>
                        <Badge variant={statusVariant(stream.status)}>
                          {statusIcon(stream.status)}
                          <span className="ml-1 capitalize">{stream.status}</span>
                        </Badge>
                      </div>
                      {stream.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{stream.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {stream.scheduledAt && (
                          <span>Scheduled: {formatDate(stream.scheduledAt)}</span>
                        )}
                        {stream.startedAt && (
                          <span>Started: {formatDate(stream.startedAt)}</span>
                        )}
                        {stream.endedAt && (
                          <span>Ended: {formatDate(stream.endedAt)}</span>
                        )}
                        {stream.recordingUrl && (
                          <Badge variant="outline" className="text-xs">Has recording</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {stream.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => goLiveMutation.mutate(stream.id)}
                          disabled={goLiveMutation.isPending}
                          data-testid={`button-golive-${stream.id}`}
                        >
                          <Radio className="w-3 h-3 mr-1" />
                          Go Live
                        </Button>
                      )}
                      {stream.status === "live" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => endStreamMutation.mutate(stream.id)}
                          disabled={endStreamMutation.isPending}
                          data-testid={`button-endstream-${stream.id}`}
                        >
                          End Stream
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(stream)}
                        data-testid={`button-edit-${stream.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(stream.id)}
                        data-testid={`button-delete-${stream.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Livestream" : "Create Livestream"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Q&A Session with Coach"
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this session is about..."
                data-testid="input-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Embed URL (YouTube/Vimeo live embed)</Label>
              <Input
                value={form.embedUrl}
                onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
                data-testid="input-embed-url"
              />
            </div>
            <div className="space-y-2">
              <Label>Recording URL (add after stream ends)</Label>
              <Input
                value={form.recordingUrl}
                onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
                data-testid="input-recording-url"
              />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail URL (optional)</Label>
              <Input
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-thumbnail-url"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as "scheduled" | "live" | "ended" })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  data-testid="input-scheduled-at"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
            >
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Livestream</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this livestream? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
