import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/app-layout";
import { Link } from "wouter";
import {
  FileText,
  BookOpen,
  Target,
  Brain,
  Heart,
  ClipboardList,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles
} from "lucide-react";
import type { Template, TemplateSubmission } from "@shared/schema";

const templateTypeConfig: Record<string, { icon: any; color: string; badgeVariant: string }> = {
  metastory: { icon: BookOpen, color: "text-blue-500", badgeVariant: "Module 3" },
  epsi: { icon: Sparkles, color: "text-amber-500", badgeVariant: "Module 4" },
  sa_objective: { icon: Target, color: "text-green-500", badgeVariant: "Module 2" },
  rnbr: { icon: Heart, color: "text-rose-500", badgeVariant: "Module 5" },
  success_failure_log: { icon: ClipboardList, color: "text-purple-500", badgeVariant: "Daily Practice" },
};

function getSubmissionStatus(submissions: TemplateSubmission[], templateId: string) {
  const templateSubs = submissions.filter(s => s.templateId === templateId);
  const draft = templateSubs.find(s => s.status === "draft");
  const submitted = templateSubs.find(s => s.status === "submitted");
  const verified = templateSubs.find(s => s.status === "verified");

  if (verified) return { label: "Verified", variant: "default" as const, icon: CheckCircle2 };
  if (submitted) return { label: "Submitted", variant: "secondary" as const, icon: Clock };
  if (draft) return { label: `Draft (${draft.progress}%)`, variant: "outline" as const, icon: Clock };
  return null;
}

export default function TemplatesPage() {
  const { data: templatesList = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const { data: submissions = [] } = useQuery<TemplateSubmission[]>({
    queryKey: ['/api/submissions'],
  });

  return (
    <AppLayout title="Template Library" subtitle="Interactive worksheets for structured mental performance work">
      <div className="p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="grid gap-4 twohanded:grid-cols-2 tablet:grid-cols-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templatesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No templates available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 twohanded:grid-cols-2 tablet:grid-cols-3">
            {templatesList.map(template => {
              const config = templateTypeConfig[template.templateType] || {
                icon: FileText,
                color: "text-muted-foreground",
                badgeVariant: template.templateType,
              };
              const Icon = config.icon;
              const status = getSubmissionStatus(submissions, template.id);

              return (
                <Link key={template.id} href={`/templates/${template.slug}`}>
                  <Card
                    className="hover-elevate active-elevate-2 cursor-pointer h-full flex flex-col"
                    data-testid={`card-template-${template.slug}`}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight">{template.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">{config.badgeVariant}</Badge>
                        </div>
                      </div>
                      {status && (
                        <Badge variant={status.variant} className="shrink-0 text-xs">
                          <status.icon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-3">
                      <CardDescription className="line-clamp-3 text-sm">
                        {template.description}
                      </CardDescription>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Start working</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
