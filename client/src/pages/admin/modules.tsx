import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  BookOpen,
  Eye,
  EyeOff,
  ChevronRight,
  Save,
} from "lucide-react";
import type { Module } from "@shared/schema";

export default function AdminModules() {
  const { toast } = useToast();
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    objectives: "",
    estimatedMinutes: 60,
    isPublished: false,
  });

  const { data: modules, isLoading } = useQuery<Module[]>({
    queryKey: ['/api/admin/modules'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/admin/modules', {
        ...data,
        objectives: data.objectives.split('\n').filter(o => o.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Module created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create module", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Module> }) => {
      return apiRequest('PATCH', `/api/admin/modules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      setEditingModule(null);
      resetForm();
      toast({ title: "Module updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update module", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
      toast({ title: "Module deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete module", variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      return apiRequest('PATCH', `/api/admin/modules/${id}`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/modules'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      objectives: "",
      estimatedMinutes: 60,
      isPublished: false,
    });
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      objectives: module.objectives.join('\n'),
      estimatedMinutes: module.estimatedMinutes,
      isPublished: module.isPublished,
    });
  };

  const handleSaveEdit = () => {
    if (!editingModule) return;
    updateMutation.mutate({
      id: editingModule.id,
      data: {
        ...formData,
        objectives: formData.objectives.split('\n').filter(o => o.trim()),
      },
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-48 mb-2" />
                <div className="h-4 bg-muted rounded w-96" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Module Management</h2>
            <p className="text-muted-foreground">Create and manage course modules</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-module">
                <Plus className="w-4 h-4 mr-2" />
                New Module
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
                <DialogDescription>Add a new training module to the course</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Module title"
                    data-testid="input-module-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Module description"
                    data-testid="input-module-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objectives (one per line)</Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    placeholder="Learn mental focus techniques&#10;Develop pre-performance routines"
                    rows={4}
                    data-testid="input-module-objectives"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 60 })}
                    data-testid="input-module-duration"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="published"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                    data-testid="switch-module-published"
                  />
                  <Label htmlFor="published">Publish immediately</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending} data-testid="button-save-module">
                  <Save className="w-4 h-4 mr-2" />
                  Create Module
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {modules?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No modules yet</h3>
                <p className="text-muted-foreground mt-1">Create your first module to get started</p>
              </CardContent>
            </Card>
          )}
          
          {modules?.map((module, index) => (
            <Card key={module.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="cursor-grab text-muted-foreground hover:text-foreground">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-muted-foreground">
                        Module {index + 1}
                      </span>
                      <Badge variant={module.isPublished ? "default" : "secondary"}>
                        {module.isPublished ? (
                          <><Eye className="w-3 h-3 mr-1" />Published</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" />Draft</>
                        )}
                      </Badge>
                    </div>
                    <h3 className="font-semibold truncate">{module.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{module.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{module.estimatedMinutes} min</span>
                      <span>{module.objectives.length} objectives</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={module.isPublished}
                      onCheckedChange={(checked) => togglePublishMutation.mutate({ id: module.id, isPublished: checked })}
                      data-testid={`switch-publish-module-${module.id}`}
                    />
                    
                    <Dialog open={editingModule?.id === module.id} onOpenChange={(open) => !open && setEditingModule(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(module)} data-testid={`button-edit-module-${module.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Module</DialogTitle>
                          <DialogDescription>Update module details</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Objectives (one per line)</Label>
                            <Textarea
                              value={formData.objectives}
                              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={formData.estimatedMinutes}
                              onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 60 })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingModule(null)}>Cancel</Button>
                          <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" data-testid={`button-delete-module-${module.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Module?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{module.title}" and all its lessons. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(module.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Link href={`/admin/modules/${module.id}/lessons`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-lessons-${module.id}`}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
