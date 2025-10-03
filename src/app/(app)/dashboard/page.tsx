'use client'

import ProjectList from '@/components/dashboard/project-list';
import { useFirebase } from '@/firebase';

export default function DashboardPage() {
  const { user } = useFirebase();

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
        Your Cooking Projects
      </h1>
      <ProjectList />
    </div>
  );
}
