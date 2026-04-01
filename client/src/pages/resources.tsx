import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/app-layout";
import { 
  FileText, 
  Grid3X3, 
  Headphones, 
  Download,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleWithProgress {
  id: number;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface Resource {
  id: number;
  moduleId: number | null;
  title: string;
  description: string | null;
  resourceType: string;
  fileUrl: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'audio':
      return Headphones;
    case 'grid':
      return Grid3X3;
    default:
      return FileText;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'audio':
      return 'Audio';
    case 'grid':
      return 'Grid';
    default:
      return 'File';
  }
};

export default function ResourcesPage() {
  const { data: modules = [], isLoading: modulesLoading, isError: modulesError } = useQuery<ModuleWithProgress[]>({
    queryKey: ['/api/modules'],
  });

  const { data: resources = [], isLoading: resourcesLoading, isError: resourcesError } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  const hasError = modulesError || resourcesError;

  const generalResources = resources.filter(r => r.moduleId === null);
  const moduleResources = modules.map(module => ({
    moduleId: module.id,
    moduleName: module.title,
    isUnlocked: module.isUnlocked,
    items: resources.filter(r => r.moduleId === module.id),
  })).filter(group => group.items.length > 0);

  const isLoading = modulesLoading || resourcesLoading;

  if (hasError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-muted-foreground">Failed to load resources. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Resources" subtitle="Downloadable worksheets, guides, and audio files">
      <div className="p-4 md:p-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">General Resources</h2>
          {isLoading ? (
            <div className="grid twohanded:grid-cols-2 tablet:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : generalResources.length === 0 ? (
            <p className="text-muted-foreground">No general resources available yet.</p>
          ) : (
            <div className="grid twohanded:grid-cols-2 tablet:grid-cols-4 gap-4">
              {generalResources.map((resource) => {
                const Icon = getTypeIcon(resource.resourceType);
                return (
                  <Card key={resource.id} className="hover-elevate">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getTypeBadge(resource.resourceType)}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{resource.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resource.description}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        data-testid={`button-download-${resource.id}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Module Resources</h2>
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : moduleResources.length === 0 ? (
            <p className="text-muted-foreground">No module-specific resources available yet.</p>
          ) : (
            <div className="space-y-6">
              {moduleResources.map((moduleGroup) => (
                <Card key={moduleGroup.moduleId}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                          moduleGroup.isUnlocked 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {moduleGroup.isUnlocked ? (
                            moduleGroup.moduleId
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            Module {moduleGroup.moduleId}: {moduleGroup.moduleName}
                          </CardTitle>
                          <CardDescription>
                            {moduleGroup.items.length} resources
                          </CardDescription>
                        </div>
                      </div>
                      {!moduleGroup.isUnlocked && (
                        <Badge variant="outline">Locked</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "grid twohanded:grid-cols-2 tablet:grid-cols-3 gap-4",
                      !moduleGroup.isUnlocked && "opacity-50"
                    )}>
                      {moduleGroup.items.map((resource) => {
                        const Icon = getTypeIcon(resource.resourceType);
                        return (
                          <div 
                            key={resource.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                          >
                            <div className="w-8 h-8 rounded bg-background flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{resource.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {resource.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!moduleGroup.isUnlocked}
                              data-testid={`button-download-${resource.id}`}
                            >
                              {moduleGroup.isUnlocked ? (
                                <Download className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
