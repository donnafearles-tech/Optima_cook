'use client';

import { useState } from 'react';
import ProjectList from '@/components/dashboard/project-list';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { firestore, user, isUserLoading, auth } = useFirebase();

  // Automatically sign in anonymously if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const projectsQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Query the subcollection of projects for the current user
    return collection(firestore, 'users', user.uid, 'projects');
  }, [firestore, user]);

  const {
    data: projects,
    isLoading: isLoadingProjects,
    error,
  } = useCollection<Project>(projectsQuery);

  if (isUserLoading || isLoadingProjects) {
    return <div>Cargando...</div>;
  }
  
  if (error) {
    // The FirebaseErrorListener will throw the error to the Next.js overlay
    // but we can still show a fallback UI here.
    return <div>Error al cargar proyectos. Revisa la consola para más detalles.</div>
  }

  // NOTE: We pass an empty array for tasks for now to avoid rendering issues.
  // A more robust solution would be to fetch task counts separately if needed.
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
