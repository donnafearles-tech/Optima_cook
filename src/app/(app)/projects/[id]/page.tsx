import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getProject } from '@/lib/data';
import { calculateCPM } from '@/lib/cpm';
import Link from 'next/link';
import { ArrowRight, FileUp, Sparkles, Wand2 } from 'lucide-react';
import ProjectClientPage from '@/components/projects/project-client-page';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = getProject(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" /> Import Recipe
          </Button>
        </div>
      </div>

      <ProjectClientPage project={project} />
    </div>
  );
}
