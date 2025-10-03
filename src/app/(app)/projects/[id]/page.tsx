'use client';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import ProjectClientPage from '@/components/projects/project-client-page';
import { useState } from 'react';
import ImportRecipeDialog from '@/components/projects/import-recipe-dialog';
import { useFirebase } from '@/firebase';

export default function ProjectPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, isUserLoading } = useFirebase();
  const [isImporting, setIsImporting] = useState(false);

  if (isUserLoading || !user) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <ProjectClientPage 
        projectId={id} 
        userId={user.uid}
        onImportRecipe={() => setIsImporting(true)}
      />
      
      {isImporting && (
         <ImportRecipeDialog
            open={isImporting}
            onOpenChange={setIsImporting}
            projectId={id}
            userId={user.uid}
          />
      )}
    </>
  );
}
