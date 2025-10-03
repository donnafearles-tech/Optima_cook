import ProjectList from '@/components/dashboard/project-list';
import { getProjects } from '@/lib/data';

export default function DashboardPage() {
  const projects = getProjects();

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
        Your Cooking Projects
      </h1>
      <ProjectList initialProjects={projects} />
    </div>
  );
}
