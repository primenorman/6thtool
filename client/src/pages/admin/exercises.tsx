import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  FileText,
  Brain,
  Target,
  Eye,
  BookOpen,
  MessageSquare,
  Grid3X3,
  Wind,
  Dumbbell,
  Play,
} from "lucide-react";
import { Link } from "wouter";
import type { Module, Lesson, Exercise } from "@shared/schema";

const EXERCISE_TEMPLATES = [
  { 
    value: 'metastory', 
    label: 'Metastory', 
    icon: BookOpen,
    description: 'Guided prompts for memory recall and positive reframing',
    defaultConfig: {
      prompts: [
        "Recall a specific performance moment...",
        "Describe what you saw, heard, and felt...",
        "Reframe this experience positively..."
      ]
    }
  },
  { 
    value: 'iap_discovery', 
    label: 'IAP Discovery', 
    icon: Brain,
    description: 'Meditation script with guided sections for self-discovery',
    defaultConfig: {
      sections: ["Introduction", "Body scan", "Visualization", "Integration"],
      duration: 15
    }
  },
  { 
    value: 'rnbr_process', 
    label: 'RNBR Process', 
    icon: Target,
    description: 'Multi-step memory reframing (Relax, Name, Breathe, Reframe)',
    defaultConfig: {
      steps: ["Relax", "Name the memory", "Breathe through it", "Reframe positively"]
    }
  },
  { 
    value: 'sa_objective', 
    label: 'SA Objective Builder', 
    icon: Target,
    description: '11-criteria form for setting structured athletic objectives',
    defaultConfig: {
      criteria: [
        "Specific outcome", "Measurable metrics", "Achievable steps",
        "Relevant to goals", "Time-bound deadline", "Process focus",
        "Controllable factors", "Challenging yet realistic", 
        "Written commitment", "Visualizable", "Emotionally connected"
      ]
    }
  },
  { 
    value: 'epsi_creation', 
    label: 'EPSI Creation', 
    icon: Eye,
    description: 'Multi-sensory success image builder (Endpoint Success Image)',
    defaultConfig: {
      senses: ["Visual", "Auditory", "Kinesthetic", "Emotional"],
      minWords: 300
    }
  },
  { 
    value: 'success_failure_log', 
    label: 'Success/Failure Log', 
    icon: FileText,
    description: 'Daily structured journal for performance reflection',
    defaultConfig: {
      prompts: ["Today's success:", "What could improve:", "Lesson learned:"]
    }
  },
  { 
    value: 'journal', 
    label: 'Journal Entry', 
    icon: MessageSquare,
    description: 'Open-ended journaling exercise',
    defaultConfig: { minLength: 50 }
  },
  { 
    value: 'grid', 
    label: 'Concentration Grid', 
    icon: Grid3X3,
    description: 'Number-finding focus training exercise',
    defaultConfig: { timeLimit: 180, gridSize: 10 }
  },
  { 
    value: 'breathing', 
    label: 'Breathing Exercise', 
    icon: Wind,
    description: 'Guided breathing patterns for centering',
    defaultConfig: { pattern: "4-7-8", cycles: 4 }
  },
];

export default function AdminExercises() {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    exerciseType: "journal",
    template: "",
    config: "",
  });

  const { data: modules } = useQuery<Module[]>({
    queryKey: ['/api/admin/modules'],
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['/api/admin/modules', selectedModule, 'lessons'],
    enabled: !!selectedModule,
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/admin/lessons', selectedLesson, 'exercises'],
    enabled: !!selectedLesson,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/exercises', {
        ...data,
        lessonId: selectedLesson,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lessons', selectedLesson, 'exercises'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Exercise created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create exercise", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/admin/exercises/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lessons', selectedLesson, 'exercises'] });
      setEditingExercise(null);
      resetForm();
      toast({ title: "Exercise updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update exercise", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/lessons', selectedLesson, 'exercises'] });
      toast({ title: "Exercise deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete exercise", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      instructions: "",
      exerciseType: "journal",
      template: "",
      config: "",
    });
  };

  const handleTemplateChange = (templateValue: string) => {
    const template = EXERCISE_TEMPLATES.find(t => t.value === templateValue);
    setFormData({
      ...formData,
      exerciseType: templateValue,
      template: templateValue,
      config: template ? JSON.stringify(template.defaultConfig, null, 2) : "",
    });
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      title: exercise.title,
      instructions: exercise.instructions,
      exerciseType: exercise.exerciseType,
      template: exercise.template || "",
      config: exercise.config || "",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Exercise Template Builder</h2>
          <p className="text-muted-foreground">Create and manage interactive exercises for lessons</p>
        </div>

        <div className="grid grid-cols-1 twohanded:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select Module</Label>
            <Select value={selectedModule?.toString() || ""} onValueChange={(v) => {
              setSelectedModule(parseInt(v));
              setSelectedLesson(null);
            }}>
              <SelectTrigger data-testid="select-module">
                <SelectValue placeholder="Choose a module" />
              </SelectTrigger>
              <SelectContent>
                {modules?.map((mod) => (
                  <SelectItem key={mod.id} value={mod.id.toString()}>
                    Module {mod.id}: {mod.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Lesson</Label>
            <Select 
              value={selectedLesson?.toString() || ""} 
              onValueChange={(v) => setSelectedLesson(parseInt(v))}
              disabled={!selectedModule}
            >
              <SelectTrigger data-testid="select-lesson">
                <SelectValue placeholder={selectedModule ? "Choose a lesson" : "Select a module first"} />
              </SelectTrigger>
              <SelectContent>
                {lessons?.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id.toString()}>
                    Lesson {lesson.orderIndex + 1}: {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedLesson && (
          <Card>
            <CardContent className="p-12 text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Select a Lesson</h3>
              <p className="text-muted-foreground mt-1">Choose a module and lesson to manage exercises</p>
            </CardContent>
          </Card>
        )}

        {selectedLesson && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold">Exercises in Lesson</h3>
              <div className="flex items-center gap-2">
                <Link href={`/admin/lessons/${selectedLesson}/interactions`}>
                  <Button variant="outline" size="sm" data-testid="button-manage-interactions">
                    <Play className="w-4 h-4 mr-1" />
                    Interactive Video
                  </Button>
                </Link>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-exercise">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exercise
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Exercise from Template</DialogTitle>
                    <DialogDescription>Select a template and customize for your lesson</DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Exercise Template</Label>
                      <div className="grid grid-cols-2 twohanded:grid-cols-3 gap-2">
                        {EXERCISE_TEMPLATES.map((template) => (
                          <button
                            key={template.value}
                            type="button"
                            onClick={() => handleTemplateChange(template.value)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              formData.exerciseType === template.value
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`template-${template.value}`}
                          >
                            <template.icon className="w-5 h-5 mb-1" />
                            <p className="text-sm font-medium">{template.label}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Exercise Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Exercise title"
                        data-testid="input-exercise-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="Instructions for completing this exercise..."
                        rows={4}
                        data-testid="input-exercise-instructions"
                      />
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="config">
                        <AccordionTrigger>Advanced Configuration (JSON)</AccordionTrigger>
                        <AccordionContent>
                          <Textarea
                            value={formData.config}
                            onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                            placeholder='{"key": "value"}'
                            rows={6}
                            className="font-mono text-sm"
                            data-testid="input-exercise-config"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Customize exercise behavior with JSON configuration
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending} data-testid="button-save-exercise">
                      <Save className="w-4 h-4 mr-2" />
                      Create Exercise
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {exercisesLoading && (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted rounded w-48 mb-2" />
                      <div className="h-4 bg-muted rounded w-96" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!exercisesLoading && exercises?.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h4 className="font-semibold">No exercises yet</h4>
                  <p className="text-sm text-muted-foreground">Add exercises from templates to this lesson</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {exercises?.map((exercise, index) => {
                const template = EXERCISE_TEMPLATES.find(t => t.value === exercise.exerciseType);
                const TemplateIcon = template?.icon || FileText;
                
                return (
                  <Card key={exercise.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <TemplateIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{exercise.title}</span>
                            <Badge variant="outline">{template?.label || exercise.exerciseType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {exercise.instructions}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog open={editingExercise?.id === exercise.id} onOpenChange={(open) => !open && setEditingExercise(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(exercise)} data-testid={`button-edit-exercise-${exercise.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Exercise</DialogTitle>
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
                                  <Label>Instructions</Label>
                                  <Textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    rows={4}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Configuration (JSON)</Label>
                                  <Textarea
                                    value={formData.config}
                                    onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                                    rows={4}
                                    className="font-mono text-sm"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingExercise(null)}>Cancel</Button>
                                <Button onClick={() => updateMutation.mutate({ id: exercise.id, data: formData })} disabled={updateMutation.isPending}>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(exercise.id)}
                            data-testid={`button-delete-exercise-${exercise.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Available Exercise Templates</CardTitle>
            <CardDescription>Reference guide for exercise types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 twohanded:grid-cols-2 tablet:grid-cols-3 gap-4">
              {EXERCISE_TEMPLATES.map((template) => (
                <div key={template.value} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <template.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{template.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
