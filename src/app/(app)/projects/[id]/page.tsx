'use client';
import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import ProjectClientPage from '@/components/projects/project-client-page';
import type { Project } from '@/lib/types';
import ImportRecipeDialog from '@/components/projects/import-recipe-dialog';

export default function ProjectPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const currentProject = projects.find(p => p.id === id);
      if (currentProject) {
        setProject(currentProject);
      } else {
        notFound();
      }
    } else {
      notFound();
    }
  }, [id]);

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    }
  };

  if (!project) {
    return <div>Loading project...</div>;
  }

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setIsImporting(true)}>
              <FileUp className="mr-2 h-4 w-4" /> Import Recipe
            </Button>
          </div>
        </div>

        <ProjectClientPage project={project} onProjectUpdate={handleProjectUpdate} />
      </div>
      <ImportRecipeDialog
        open={isImporting}
        onOpenChange={setIsImporting}
        project={project}
        onProjectUpdate={handleProjectUpdate}
      />
    </>
  );
}
