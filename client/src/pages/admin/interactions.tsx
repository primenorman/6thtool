import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  GitBranch,
  Brain,
  Clock,
  X,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

interface InteractionOption {
  id: string;
  label: string;
  isCorrect?: boolean;
  followUpContent?: string;
  branchToSec?: number;
}

interface InteractionPoint {
  id: string;
  lessonId: number;
  timestampSec: number;
  promptType: string;
  promptText: string;
  promptSubtext?: string | null;
  options: InteractionOption[];
  followUpContent?: string | null;
  isPausePoint: boolean;
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
}

const PROMPT_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice", icon: HelpCircle, description: "Pick one option from a list" },
  { value: "reflection", label: "Pause & Reflect", icon: MessageCircle, description: "Free-text reflection moment" },
  { value: "scenario", label: "Decision Point", icon: GitBranch, description: "Choose a path — video branches" },
  { value: "knowledge_check", label: "Knowledge Check", icon: Brain, description: "Right/wrong answer with feedback" },
];

const PROMPT_COLORS: Record<string, string> = {
  multiple_choice: "bg-blue-500",
  reflection: "bg-purple-500",
  scenario: "bg-amber-500",
  knowledge_check: "bg-emerald-500",
};

interface InteractionForm {
  timestampSec: number;
  timestampMin: string;
  timestampSecField: string;
  promptType: string;
  promptText: string;
  promptSubtext: string;
  options: InteractionOption[];
  followUpContent: string;
  isPausePoint: boolean;
  isPublished: boolean;
}

const emptyForm: InteractionForm = {
  timestampSec: 0,
  timestampMin: "0",
  timestampSecField: "0",
  promptType: "multiple_choice",
  promptText: "",
  promptSubtext: "",
  options: [],
  followUpContent: "",
  isPausePoint: true,
  isPublished: true,
};

function generateOptionId(): string {
  return `opt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminInteractions() {
  const { toast } = useToast();
  const [, params] = useRoute("/admin/lessons/:lessonId/interactions");
  const lessonId = parseInt(params?.lessonId || "0");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InteractionForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: lesson } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: lessonId > 0,
  });

  const { data: points = [], isLoading } = useQuery<InteractionPoint[]>({
    queryKey: ["/api/admin/lessons", lessonId, "interactions"],
    enabled: lessonId > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/interactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", lessonId, "interactions"] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast({ title: "Interaction point created" });
    },
    onError: () => toast({ title: "Failed to create interaction point", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/interactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", lessonId, "interactions"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: "Interaction point updated" });
    },
    onError: () => toast({ title: "Failed to update interaction point", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/interactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", lessonId, "interactions"] });
      setDeleteConfirm(null);
      toast({ title: "Interaction point deleted" });
    },
    onError: () => toast({ title: "Failed to delete interaction point", variant: "destructive" }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      apiRequest("PATCH", `/api/admin/interactions/${id}`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", lessonId, "interactions"] });
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, options: [{ id: generateOptionId(), label: "", isCorrect: false, followUpContent: "" }] });
    setDialogOpen(true);
  }

  function openEdit(point: InteractionPoint) {
    setEditingId(point.id);
    const m = Math.floor(point.timestampSec / 60);
    const s = Math.floor(point.timestampSec % 60);
    setForm({
      timestampSec: point.timestampSec,
      timestampMin: m.toString(),
      timestampSecField: s.toString(),
      promptType: point.promptType,
      promptText: point.promptText,
      promptSubtext: point.promptSubtext || "",
      options: (point.options as InteractionOption[]) || [],
      followUpContent: point.followUpContent || "",
      isPausePoint: point.isPausePoint,
      isPublished: point.isPublished,
    });
    setDialogOpen(true);
  }

  function addOption() {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { id: generateOptionId(), label: "", isCorrect: false, followUpContent: "" }],
    }));
  }

  function removeOption(id: string) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o.id !== id),
    }));
  }

  function updateOption(id: string, field: string, value: any) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    }));
  }

  function handleSubmit() {
    if (!form.promptText.trim()) {
      toast({ title: "Question text is required", variant: "destructive" });
      return;
    }

    const timestampSec = parseInt(form.timestampMin || "0") * 60 + parseInt(form.timestampSecField || "0");

    const payload = {
      lessonId,
      timestampSec,
      promptType: form.promptType,
      promptText: form.promptText.trim(),
      promptSubtext: form.promptSubtext.trim() || null,
      options: form.promptType === "reflection" ? [] : form.options,
      followUpContent: form.followUpContent.trim() || null,
      isPausePoint: form.isPausePoint,
      isPublished: form.isPublished,
      orderIndex: editingId ? undefined : points.length,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const typeInfo = PROMPT_TYPES.find((t) => t.value === form.promptType);
  const showOptions = form.promptType !== "reflection";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href={`/admin/modules`}>
              <Button variant="ghost" size="sm" data-testid="button-back-modules">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-interactions-title">Interactive Video Points</h2>
              <p className="text-muted-foreground text-sm">
                {lesson ? `Lesson: ${lesson.title}` : `Lesson #${lessonId}`}
              </p>
            </div>
          </div>
          <Button onClick={openCreate} data-testid="button-create-interaction">
            <Plus className="w-4 h-4 mr-2" />
            Add Interaction
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{points.length}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </CardContent>
          </Card>
          {PROMPT_TYPES.map((type) => {
            const count = points.filter((p) => p.promptType === type.value).length;
            if (count === 0) return null;
            return (
              <Card key={type.value}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-md ${PROMPT_COLORS[type.value]}/10 flex items-center justify-center`}>
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{type.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : points.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No interaction points yet. Add your first one to make this lesson interactive.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {points
              .sort((a, b) => a.timestampSec - b.timestampSec)
              .map((point) => {
                const typeConfig = PROMPT_TYPES.find((t) => t.value === point.promptType);
                const options = (point.options || []) as InteractionOption[];
                const TypeIcon = typeConfig?.icon || HelpCircle;
                return (
                  <Card key={point.id} data-testid={`card-interaction-${point.id}`} className={!point.isPublished ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex items-center gap-2 shrink-0">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="outline" className="gap-1 font-mono text-xs">
                            <Clock className="w-3 h-3" />
                            {formatTime(point.timestampSec)}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${PROMPT_COLORS[point.promptType]} text-white gap-1`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeConfig?.label || point.promptType}
                            </Badge>
                            {!point.isPublished && <Badge variant="secondary">Draft</Badge>}
                          </div>
                          <p className="font-medium text-sm line-clamp-2">{point.promptText}</p>
                          {options.length > 0 && (
                            <p className="text-xs text-muted-foreground">{options.length} option{options.length !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => togglePublishMutation.mutate({ id: point.id, isPublished: !point.isPublished })}
                            title={point.isPublished ? "Unpublish" : "Publish"}
                            data-testid={`button-toggle-publish-${point.id}`}
                          >
                            {point.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(point)} data-testid={`button-edit-${point.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteConfirm(point.id)} data-testid={`button-delete-${point.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Interaction Point" : "Add Interaction Point"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Timestamp (min)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.timestampMin}
                  onChange={(e) => setForm({ ...form, timestampMin: e.target.value })}
                  placeholder="0"
                  data-testid="input-timestamp-min"
                />
              </div>
              <div className="space-y-2">
                <Label>Timestamp (sec)</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={form.timestampSecField}
                  onChange={(e) => setForm({ ...form, timestampSecField: e.target.value })}
                  placeholder="0"
                  data-testid="input-timestamp-sec"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.promptType} onValueChange={(v) => setForm({ ...form, promptType: v })}>
                <SelectTrigger data-testid="select-prompt-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeInfo && <p className="text-xs text-muted-foreground">{typeInfo.description}</p>}
            </div>

            <div className="space-y-2">
              <Label>Question / Prompt</Label>
              <Textarea
                value={form.promptText}
                onChange={(e) => setForm({ ...form, promptText: e.target.value })}
                placeholder="What question should the player answer?"
                data-testid="input-prompt-text"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtext (optional)</Label>
              <Input
                value={form.promptSubtext}
                onChange={(e) => setForm({ ...form, promptSubtext: e.target.value })}
                placeholder="Additional context or hint..."
                data-testid="input-prompt-subtext"
              />
            </div>

            {showOptions && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button variant="outline" size="sm" onClick={addOption} data-testid="button-add-option">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Option
                  </Button>
                </div>
                {form.options.map((opt, idx) => (
                  <Card key={opt.id} className="border">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono w-5">#{idx + 1}</span>
                        <Input
                          value={opt.label}
                          onChange={(e) => updateOption(opt.id, "label", e.target.value)}
                          placeholder="Option text..."
                          className="flex-1"
                          data-testid={`input-option-label-${idx}`}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeOption(opt.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {form.promptType === "knowledge_check" && (
                        <div className="flex items-center gap-2 pl-7">
                          <Switch
                            checked={opt.isCorrect || false}
                            onCheckedChange={(v) => updateOption(opt.id, "isCorrect", v)}
                            data-testid={`switch-correct-${idx}`}
                          />
                          <Label className="text-xs">Correct answer</Label>
                        </div>
                      )}

                      <div className="pl-7">
                        <Input
                          value={opt.followUpContent || ""}
                          onChange={(e) => updateOption(opt.id, "followUpContent", e.target.value)}
                          placeholder="Follow-up message after selecting this..."
                          className="text-sm"
                          data-testid={`input-option-followup-${idx}`}
                        />
                      </div>

                      {form.promptType === "scenario" && (
                        <div className="pl-7 flex items-center gap-2">
                          <Label className="text-xs whitespace-nowrap">Branch to (sec):</Label>
                          <Input
                            type="number"
                            min="0"
                            value={opt.branchToSec ?? ""}
                            onChange={(e) => updateOption(opt.id, "branchToSec", e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Jump to timestamp"
                            className="w-28 text-sm"
                            data-testid={`input-option-branch-${idx}`}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {form.promptType === "reflection" && (
              <div className="space-y-2">
                <Label>Follow-up message (shown after reflection)</Label>
                <Textarea
                  value={form.followUpContent}
                  onChange={(e) => setForm({ ...form, followUpContent: e.target.value })}
                  placeholder="Great reflection. Keep this awareness during your next at-bat..."
                  data-testid="input-followup-content"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPausePoint}
                  onCheckedChange={(v) => setForm({ ...form, isPausePoint: v })}
                  data-testid="switch-pause-point"
                />
                <Label className="text-sm">Pause video</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
                  data-testid="switch-published"
                />
                <Label className="text-sm">Published</Label>
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
              data-testid="button-save-interaction"
            >
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Interaction Point</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Are you sure? This will also delete all student responses for this interaction.</p>
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
