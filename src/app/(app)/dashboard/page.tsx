'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectList from '@/components/dashboard/project-list';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Project } from '@/lib/types';


export default function DashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const projectsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'projects');
  }, [firestore, user]);

  const {
    data: projects,
    isLoading: isLoadingProjects,
    error,
  } = useCollection<Project>(projectsQuery);

  if (isUserLoading || isLoadingProjects || !user) {
    return <div>Cargando...</div>;
  }
  
  if (error) {
    return <div>Error al cargar proyectos. Revisa la consola para más detalles.</div>
  }

  const projectsWithTaskPlaceholder = projects?.map(p => ({ ...p, tasks: [] })) || [];

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
        Tus Proyectos de Cocina
      </h1>
      <ProjectList projects={projectsWithTaskPlaceholder} />
    </div>
  );
}
