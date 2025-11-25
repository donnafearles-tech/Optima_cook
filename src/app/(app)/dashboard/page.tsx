'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectList from '@/components/dashboard/project-list';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import type { Project } from '@/lib/types';

export default function DashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const [projectsWithTasks, setProjectsWithTasks] = useState<Project[]>([]);
  const [isLoadingAllData, setIsLoadingAllData] = useState(true);

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
  } = useCollection<Omit<Project, 'tasks'>>(projectsQuery);

  useEffect(() => {
    if (projects && user) {
      setIsLoadingAllData(true);
      const fetchTasksForAllProjects = async () => {
        const projectsData = await Promise.all(
          projects.map(async (project) => {
            const tasksCollection = collection(firestore, 'users', user.uid, 'projects', project.id, 'tasks');
            const tasksSnapshot = await getDocs(tasksCollection);
            const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
            return { ...project, tasks: tasks as any[] };
          })
        );
        setProjectsWithTasks(projectsData);
        setIsLoadingAllData(false);
      };

      fetchTasksForAllProjects();
    } else if (!isLoadingProjects) {
       setIsLoadingAllData(false);
       setProjectsWithTasks([]);
    }
  }, [projects, firestore, user, isLoadingProjects]);

  if (isUserLoading || isLoadingProjects) {
    return <div>Cargando...</div>;
  }
  
  if (error) {
    return <div>Error al cargar proyectos. Revisa la consola para más detalles.</div>
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
        Tus Proyectos de Cocina
      </h1>
      <ProjectList projects={projectsWithTasks} isLoading={isLoadingAllData} />
    </div>
  );
}
