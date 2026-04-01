import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLayout } from "@/components/app-layout";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Send,
  Eye,
  FileText,
  Clock
} from "lucide-react";
import type { Template, TemplateSubmission } from "@shared/schema";

interface FieldConfig {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "slider";
  placeholder?: string;
  helpText?: string;
  minLength?: number;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

interface StepConfig {
  id: string;
  stepNumber: number;
  label: string;
  fields: FieldConfig[];
}

interface TemplateConfig {
  steps: StepConfig[];
  outputTemplate?: string;
}

function parseConfig(raw: string | null): TemplateConfig | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseResponses(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function generateOutput(config: TemplateConfig, responses: Record<string, string>): string {
  if (!config.outputTemplate) return "";
  let output = config.outputTemplate;
  for (const [key, value] of Object.entries(responses)) {
    output = output.replace(new RegExp(`\\{${key}\\}`, "g"), value || "___");
  }
  return output;
}

function FieldValidation({ field, value }: { field: FieldConfig; value: string }) {
  if (!field.minLength || !value) return null;
  const len = value.length;
  const pct = Math.min(100, Math.round((len / field.minLength) * 100));
  const isValid = len >= field.minLength;

  return (
    <div className="flex items-center gap-2 mt-1">
      <Progress value={pct} className="h-1.5 flex-1" />
      <span className={`text-xs ${isValid ? "text-green-500" : "text-muted-foreground"}`}>
        {isValid ? (
          <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Good length</span>
        ) : (
          `${len}/${field.minLength} characters`
        )}
      </span>
    </div>
  );
}

function SliderField({ field, value, onChange }: { field: FieldConfig; value: string; onChange: (v: string) => void }) {
  const numVal = parseInt(value) || field.min || 1;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{numVal}</span>
        <span className="text-xs text-muted-foreground">{field.min || 1} - {field.max || 10}</span>
      </div>
      <input
        type="range"
        min={field.min || 1}
        max={field.max || 10}
        value={numVal}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-primary"
        data-testid={`slider-${field.id}`}
      />
    </div>
  );
}

export default function TemplateFormPage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const { data: templatesList = [] } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const template = templatesList.find(t => t.slug === params.slug);

  const { data: submissions = [] } = useQuery<TemplateSubmission[]>({
    queryKey: ['/api/templates', template?.id, 'submissions'],
    enabled: !!template?.id,
  });

  const config = template ? parseConfig(template.templateConfig) : null;

  useEffect(() => {
    if (submissions.length > 0) {
      const draft = submissions.find(s => s.status === "draft");
      if (draft) {
        const parsed = parseResponses(draft.responses);
        setResponses(parsed);
        setCurrentStep(draft.lastStep || 0);
        lastSavedRef.current = JSON.stringify(parsed);
      }
    }
  }, [submissions]);

  const saveMutation = useMutation({
    mutationFn: async (data: { responses: Record<string, string>; lastStep: number; progress: number; generatedOutput?: string }) => {
      if (!template) return;
      const res = await apiRequest("POST", `/api/templates/${template.id}/save`, {
        responses: JSON.stringify(data.responses),
        lastStep: data.lastStep,
        progress: data.progress,
        generatedOutput: data.generatedOutput,
      });
      return res.json();
    },
    onSuccess: () => {
      setLastSavedTime(new Date());
      lastSavedRef.current = JSON.stringify(responses);
      queryClient.invalidateQueries({ queryKey: ['/api/templates', template?.id, 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const draft = submissions.find(s => s.status === "draft");
      if (!draft) {
        await saveMutation.mutateAsync({
          responses,
          lastStep: config ? config.steps.length - 1 : 0,
          progress: 100,
          generatedOutput: config ? generateOutput(config, responses) : undefined,
        });
        const refreshed = await (await fetch(`/api/templates/${template!.id}/submissions`)).json();
        const newDraft = refreshed.find((s: any) => s.status === "draft");
        if (!newDraft) throw new Error("No draft to submit");
        const res = await apiRequest("POST", `/api/submissions/${newDraft.id}/submit`);
        return res.json();
      }
      const res = await apiRequest("POST", `/api/submissions/${draft.id}/submit`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your template has been submitted for review." });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', template?.id, 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
    },
  });

  const computeProgress = useCallback(() => {
    if (!config) return 0;
    const totalFields = config.steps.reduce((acc, step) => acc + step.fields.length, 0);
    if (totalFields === 0) return 0;
    const filledFields = config.steps.reduce((acc, step) => {
      return acc + step.fields.filter(f => {
        const val = responses[f.id];
        if (!val) return false;
        if (f.minLength && val.length < f.minLength) return false;
        return true;
      }).length;
    }, 0);
    return Math.round((filledFields / totalFields) * 100);
  }, [config, responses]);

  const doAutoSave = useCallback(() => {
    const currentJson = JSON.stringify(responses);
    if (currentJson === lastSavedRef.current || !template || !config) return;
    saveMutation.mutate({
      responses,
      lastStep: currentStep,
      progress: computeProgress(),
      generatedOutput: generateOutput(config, responses),
    });
  }, [responses, currentStep, template, config, computeProgress]);

  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(doAutoSave, 10000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [doAutoSave]);

  useEffect(() => {
    return () => {
      doAutoSave();
    };
  }, []);

  const handleFieldChange = (fieldId: string, value: string) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleManualSave = () => {
    if (!template || !config) return;
    saveMutation.mutate({
      responses,
      lastStep: currentStep,
      progress: computeProgress(),
      generatedOutput: generateOutput(config, responses),
    });
  };

  const canAdvance = () => {
    if (!config) return false;
    const step = config.steps[currentStep];
    if (!step) return false;
    return step.fields.every(f => {
      if (!f.required) return true;
      const val = responses[f.id];
      if (!val || val.trim() === "") return false;
      return true;
    });
  };

  const handleNext = () => {
    if (!config) return;
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      doAutoSave();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    handleManualSave();
    submitMutation.mutate();
  };

  const existingSubmitted = submissions.find(s => s.status === "submitted" || s.status === "verified");

  if (!template || !config) {
    return (
      <AppLayout title="Loading..." subtitle="Template">
        <div className="p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  const step = config.steps[currentStep];
  const progress = computeProgress();
  const isLastStep = currentStep === config.steps.length - 1;

  const headerRight = (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleManualSave}
        disabled={saveMutation.isPending}
        data-testid="button-save-draft"
      >
        <Save className="w-4 h-4 mr-1" />
        {saveMutation.isPending ? "Saving..." : "Save"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPreview(!showPreview)}
        data-testid="button-toggle-preview"
      >
        <Eye className="w-4 h-4 mr-1" />
        {showPreview ? "Editor" : "Preview"}
      </Button>
    </div>
  );

  return (
    <AppLayout
      title={template.name}
      subtitle={`Step ${currentStep + 1} of ${config.steps.length}${lastSavedTime ? ` · Saved ${lastSavedTime.toLocaleTimeString()}` : ''}`}
      headerRight={headerRight}
    >
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{progress}% Complete</span>
            {existingSubmitted && (
              <Badge variant="default" data-testid="badge-submitted">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {existingSubmitted.status === "verified" ? "Verified" : "Submitted"}
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-template" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {config.steps.map((s, i) => {
            const stepCompleted = s.fields.every(f => {
              const val = responses[f.id];
              if (!f.required) return true;
              return val && val.trim() !== "";
            });
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : stepCompleted
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid={`button-step-${i}`}
              >
                {stepCompleted && i !== currentStep && <Check className="w-3 h-3" />}
                {s.stepNumber || i + 1}. {s.label}
              </button>
            );
          })}
        </div>

        {showPreview ? (
          <Card data-testid="card-preview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generated Output
              </CardTitle>
              <CardDescription>Preview of your completed template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 p-4 rounded-md min-h-[200px]" data-testid="text-preview-output">
                {generateOutput(config, responses) || "Complete more fields to see the generated output."}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="card-step-form">
            <CardHeader>
              <CardTitle className="text-lg">{step.label}</CardTitle>
              {template.instructions && currentStep === 0 && (
                <CardDescription className="text-sm">
                  {template.instructions}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {step.fields.map((field, fieldIndex) => {
                const prevFieldsFilled = step.fields.slice(0, fieldIndex).every(f => {
                  if (!f.required) return true;
                  const val = responses[f.id];
                  return val && val.trim() !== "";
                });

                if (fieldIndex > 0 && !prevFieldsFilled) {
                  return (
                    <div key={field.id} className="opacity-40 pointer-events-none select-none" data-testid={`field-locked-${field.id}`}>
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {field.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">Complete the field above to unlock this one</p>
                    </div>
                  );
                }

                return (
                  <div key={field.id} className="space-y-2 animate-in fade-in duration-300" data-testid={`field-${field.id}`}>
                    <Label htmlFor={field.id} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}

                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="min-h-[120px] resize-y"
                        data-testid={`input-${field.id}`}
                      />
                    ) : field.type === "number" || field.type === "slider" ? (
                      <SliderField
                        field={field}
                        value={responses[field.id] || ""}
                        onChange={(v) => handleFieldChange(field.id, v)}
                      />
                    ) : field.type === "select" && field.options ? (
                      <Select
                        value={responses[field.id] || ""}
                        onValueChange={(v) => handleFieldChange(field.id, v)}
                      >
                        <SelectTrigger data-testid={`select-${field.id}`}>
                          <SelectValue placeholder={field.placeholder || "Select..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.id}
                        type="text"
                        placeholder={field.placeholder}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        data-testid={`input-${field.id}`}
                      />
                    )}

                    <FieldValidation field={field} value={responses[field.id] || ""} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-4 pb-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || progress < 50}
                data-testid="button-submit-template"
              >
                <Send className="w-4 h-4 mr-1" />
                {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canAdvance()}
                data-testid="button-next-step"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
