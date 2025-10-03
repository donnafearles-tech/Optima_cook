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
    return query(
      collection(firestore, 'projects'),
      where('ownerId', '==', user.uid)
    );
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
    console.error(error);
    return <div>Error al cargar proyectos.</div>
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
        Tus Proyectos de Cocina
      </h1>
      <ProjectList projects={projects || []} />
    </div>
  );
}
