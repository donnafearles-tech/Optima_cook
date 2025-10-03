'use client';
import { useEffect, useState, useRef } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { X, Sparkles } from 'lucide-react';
import type { UserResource } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestKeywordsForResource } from '@/ai/flows/suggest-keyword-for-resource';

interface ResourceFormSheetProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  resource: UserResource | null;
  onSave: (resource: Omit<UserResource, 'id'>) => void;
}

export default function ResourceFormSheet({
  open,
  onOpenChange,
  resource,
  onSave,
}: ResourceFormSheetProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (resource) {
        setName(resource.name);
        setQuantity(resource.quantity);
        setKeywords(resource.keywords);
      } else {
        // Reset for new resource
        setName('');
        setQuantity(1);
        setKeywords([]);
      }
      setNewKeyword('');
    }
  }, [resource, open]);

  const handleSuggestKeywords = async () => {
    if (!name) {
        toast({ title: "Falta el nombre", description: "Escribe un nombre para el recurso antes de pedir sugerencias.", variant: "destructive" });
        return;
    };
    setIsSuggesting(true);
    try {
        const result = await suggestKeywordsForResource({ resourceName: name });
        if (result.keywords.length > 0) {
            setKeywords(prev => [...new Set([...prev, ...result.keywords])]);
            toast({ title: 'Sugerencias Añadidas', description: 'La IA ha añadido nuevas palabras clave.' });
        } else {
            toast({ title: 'Sin Sugerencias', description: 'La IA no encontró sugerencias para este recurso.' });
        }
    } catch(e) {
        toast({ title: 'Error de IA', description: 'No se pudieron obtener sugerencias.', variant: 'destructive' });
    } finally {
        setIsSuggesting(false);
    }
  }

  const handleAddKeyword = () => {
    const trimmedKeyword = newKeyword.toLowerCase().trim();
    if (trimmedKeyword) {
      if (keywords.includes(trimmedKeyword)) {
        toast({
            title: "Palabra Clave Duplicada",
            description: `La palabra clave "${trimmedKeyword}" ya ha sido añadida.`,
            variant: "destructive",
        });
      } else {
        setKeywords(prev => [...prev, trimmedKeyword]);
      }
      setNewKeyword('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        toast({
            title: "Falta el nombre",
            description: "Todo recurso debe tener un nombre.",
            variant: "destructive",
        });
        return;
    }

    onSave({
      name,
      quantity,
      keywords,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col" onOpenAutoFocus={() => nameInputRef.current?.focus()}>
        <SheetHeader>
          <SheetTitle className="font-headline">{resource ? 'Editar Recurso' : 'Añadir Nuevo Recurso'}</SheetTitle>
          <SheetDescription>
            Define un utensilio o electrodoméstico de tu cocina.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-6 py-4">
            <div>
              <Label htmlFor="name">Nombre del Recurso</Label>
              <Input
                id="name"
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                placeholder="Ej. Horno, Licuadora, Sartén Grande"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                required
                min="1"
                className="mt-1"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="keywords">Palabras Clave</Label>
                <Button type="button" size="sm" variant="ghost" onClick={handleSuggestKeywords} disabled={isSuggesting || !name}>
                    {isSuggesting ? <Sparkles className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Sugerencia IA
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                    id="keywords"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); }}}
                    placeholder="Ej. hornear, asar..."
                />
                <Button type="button" variant="outline" onClick={handleAddKeyword}>Añadir</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pulsa Enter o clic en Añadir.</p>
              
              <div className="mt-2 flex flex-wrap gap-1">
                {keywords.map((kw, index) => (
                  <Badge key={`${kw}-${index}`} variant="secondary">
                    {kw}
                    <button
                      type="button"
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                      onClick={() => setKeywords(prev => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

        </form>
         <SheetFooter>
            <SheetClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </SheetClose>
            <Button type="submit" onClick={handleSubmit}>Guardar Recurso</Button>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
