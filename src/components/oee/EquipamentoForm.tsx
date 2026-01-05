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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEquipamento, useUpdateEquipamento, Equipamento } from '@/hooks/useEquipamentos';
import { Plus, Pencil } from 'lucide-react';

const equipamentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  codigo: z.string().max(50).optional(),
  capacidade_hora: z.number().min(1).optional(),
  status: z.enum(['ativo', 'inativo', 'manutencao']),
});

type EquipamentoFormData = z.infer<typeof equipamentoSchema>;

interface EquipamentoFormProps {
  equipamento?: Equipamento;
  trigger?: React.ReactNode;
}

const EquipamentoForm = ({ equipamento, trigger }: EquipamentoFormProps) => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateEquipamento();
  const updateMutation = useUpdateEquipamento();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EquipamentoFormData>({
    resolver: zodResolver(equipamentoSchema),
    defaultValues: equipamento
      ? {
          nome: equipamento.nome,
          codigo: equipamento.codigo || '',
          capacidade_hora: equipamento.capacidade_hora || undefined,
          status: equipamento.status as 'ativo' | 'inativo' | 'manutencao',
        }
      : {
          nome: '',
          codigo: '',
          capacidade_hora: 100,
          status: 'ativo',
        },
  });

  const onSubmit = async (data: EquipamentoFormData) => {
    try {
      if (equipamento) {
        await updateMutation.mutateAsync({ id: equipamento.id, ...data });
      } else {
        await createMutation.mutateAsync({
          nome: data.nome,
          codigo: data.codigo || null,
          capacidade_hora: data.capacidade_hora || null,
          status: data.status,
        });
      }
      setOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving equipamento:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Novo Segmento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">
            {equipamento ? 'Editar Segmento' : 'Novo Segmento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: Linha 1 - Extrusão"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              {...register('codigo')}
              placeholder="Ex: EXT-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidade_hora">Meta (kg)</Label>
            <Input
              id="capacidade_hora"
              type="number"
              {...register('capacidade_hora', { valueAsNumber: true })}
              placeholder="Ex: 120"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as 'ativo' | 'inativo' | 'manutencao')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="manutencao">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipamentoForm;
