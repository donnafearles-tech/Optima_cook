'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectList from '@/components/dashboard/project-list';
import { useFirebase, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useCollection } from '@/firebase/firestore';
import { collection, query, getDocs, DocumentData, doc, writeBatch } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import CreateProjectDialog from '@/components/dashboard/create-project-dialog';

export default function DashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const [projectsWithTasks, setProjectsWithTasks] = useState<Project[]>([]);
  const [isLoadingAllData, setIsLoadingAllData] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null | 'new'>(null);

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

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;
    const projectDocRef = doc(firestore, 'users', user.uid, 'projects', projectId);
    
    // Also delete subcollections
    const batch = writeBatch(firestore);
    
    const tasksCollectionRef = collection(projectDocRef, 'tasks');
    const tasksSnapshot = await getDocs(tasksCollectionRef);
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));

    const recipesCollectionRef = collection(projectDocRef, 'recipes');
    const recipesSnapshot = await getDocs(recipesCollectionRef);
    recipesSnapshot.forEach(doc => batch.delete(doc.ref));

    batch.delete(projectDocRef);
    
    await batch.commit();
  };

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
    <>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
          Tus Proyectos de Cocina
        </h1>
        <ProjectList 
          projects={projectsWithTasks} 
          isLoading={isLoadingAllData}
          onNewProject={() => setEditingProject('new')}
          onEditProject={(project) => setEditingProject(project)}
          onDeleteProject={handleDeleteProject}
        />
      </div>
      <CreateProjectDialog
        open={editingProject !== null}
        onOpenChange={(isOpen) => !isOpen && setEditingProject(null)}
        project={editingProject === 'new' ? null : editingProject}
      />
    </>
  );
}
