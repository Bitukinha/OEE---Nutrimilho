import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useAllMotivoBloqueios,
  useCreateMotivoBloqueio,
  useUpdateMotivoBloqueio,
  useDeleteMotivoBloqueio,
  MotivoBloqueio,
} from '@/hooks/useMotivos';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

const motivoSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type MotivoFormData = z.infer<typeof motivoSchema>;

interface MotivoFormProps {
  motivo?: MotivoBloqueio;
  onClose: () => void;
}

const MotivoForm = ({ motivo, onClose }: MotivoFormProps) => {
  const createMutation = useCreateMotivoBloqueio();
  const updateMutation = useUpdateMotivoBloqueio();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MotivoFormData>({
    resolver: zodResolver(motivoSchema),
    defaultValues: motivo || {
      nome: '',
      descricao: '',
      ativo: true,
    },
  });

  const onSubmit = async (data: MotivoFormData) => {
    try {
      if (motivo) {
        await updateMutation.mutateAsync({ ...motivo, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving motivo:', error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: Desvio de especificação"
        />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descrição detalhada do motivo..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ativo">Status</Label>
        <Select
          value={watch('ativo') ? 'sim' : 'nao'}
          onValueChange={(value) => setValue('ativo', value === 'sim')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sim">Ativo</SelectItem>
            <SelectItem value="nao">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : motivo ? (
            'Atualizar'
          ) : (
            'Criar'
          )}
        </Button>
      </div>
    </form>
  );
};

export const GerenciadorMotivosBloqueios = () => {
  const [open, setOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState<MotivoBloqueio | null>(null);
  const { data: motivos, isLoading } = useAllMotivoBloqueios();
  const deleteMutation = useDeleteMotivoBloqueio();

  const handleEdit = (motivo: MotivoBloqueio) => {
    setEditingMotivo(motivo);
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditingMotivo(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Motivos de Bloqueios</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Motivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMotivo ? 'Editar Motivo de Bloqueio' : 'Criar Novo Motivo de Bloqueio'}
              </DialogTitle>
            </DialogHeader>
            <MotivoForm motivo={editingMotivo} onClose={handleCloseForm} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {motivos?.map((motivo) => (
          <Card key={motivo.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{motivo.nome}</h4>
                    {!motivo.ativo && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  {motivo.descricao && <p className="text-sm text-muted-foreground">{motivo.descricao}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(motivo)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deletar Motivo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar "{motivo.nome}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(motivo.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
