import ProjectList from '@/components/dashboard/project-list';

export default function DashboardPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
        Your Cooking Projects
      </h1>
      <ProjectList />
    </div>
  );
}
