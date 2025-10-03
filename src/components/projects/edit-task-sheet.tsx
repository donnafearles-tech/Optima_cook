'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Task } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface EditTaskSheetProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
  allTasks: Task[];
  onSave: (task: Task) => void;
}

export default function EditTaskSheet({
  open,
  onOpenChange,
  task,
  allTasks,
  onSave,
}: EditTaskSheetProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(0);
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && task) {
      setName(task.name);
      setDuration(task.duration);
      setPredecessorIds(task.predecessorIds);
    } else {
      setName('');
      setDuration(0);
      setPredecessorIds([]);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || duration <= 0) return;

    onSave({
      id: task?.id || '',
      name,
      duration,
      predecessorIds,
      recipeId: task?.recipeId || 'rec_1', // Default for simplicity
      status: task?.status || 'pending',
    });
  };

  const availablePredecessors = allTasks.filter(t => t.id !== task?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">{task ? 'Edit Task' : 'Add New Task'}</SheetTitle>
          <SheetDescription>
            Fill in the details for your cooking task. Durations are in minutes.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4">
          <div className="space-y-4 py-4 flex-grow">
            <div>
              <Label htmlFor="name">Task Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (in minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration / 60}
                onChange={(e) => setDuration(Number(e.target.value) * 60)}
                required
                min="1"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="predecessors">Dependencies</Label>
              <Select onValueChange={(value) => {
                  if (value && !predecessorIds.includes(value)) {
                    setPredecessorIds(prev => [...prev, value])
                  }
                }}>
                <SelectTrigger id="predecessors" className="mt-1">
                  <SelectValue placeholder="Add a predecessor task" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {availablePredecessors.filter(p => !predecessorIds.includes(p.id)).map(pTask => (
                      <SelectItem key={pTask.id} value={pTask.id}>
                        {pTask.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-1">
                {predecessorIds.map(pId => {
                  const pTask = allTasks.find(t => t.id === pId);
                  return (
                    <Badge key={pId} variant="secondary">
                      {pTask?.name}
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                        onClick={() => setPredecessorIds(prev => prev.filter(id => id !== pId))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </SheetClose>
            <Button type="submit">Save Task</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
