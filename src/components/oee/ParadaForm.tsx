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
import { useCreateParada } from '@/hooks/useParadas';
import { useTurnos } from '@/hooks/useTurnos';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const paradaSchema = z.object({
  turno_id: z.string().min(1, 'Selecione um turno'),
  equipamento_id: z.string().min(1, 'Selecione um segmento'),
  data: z.string().min(1, 'Data é obrigatória'),
  duracao: z.number().min(1, 'Duração deve ser maior que 0'),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
});

type ParadaFormData = z.infer<typeof paradaSchema>;

const ParadaForm = () => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateParada();
  const { data: turnos } = useTurnos();
  const { data: equipamentos } = useEquipamentos();
  // motivos are no longer fetched from DB; keep free-text motivo

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ParadaFormData>({
    resolver: zodResolver(paradaSchema),
    defaultValues: {
      turno_id: '',
      equipamento_id: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      duracao: 0,
      motivo: '',
      categoria: 'nao_planejada',
      observacoes: '',
    },
  });

  const onSubmit = async (data: ParadaFormData) => {
    try {
      await createMutation.mutateAsync({
        turno_id: data.turno_id,
        equipamento_id: data.equipamento_id,
        data: data.data,
        duracao: data.duracao,
        motivo: data.motivo,
        categoria: data.categoria,
        observacoes: data.observacoes,
      });
      setOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving parada:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Parada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Parada de Máquina</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              {...register('data')}
            />
            {errors.data && (
              <p className="text-sm text-destructive">{errors.data.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="turno_id">Turno *</Label>
            <Select
              value={watch('turno_id')}
              onValueChange={(value) => setValue('turno_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                {turnos?.map((turno) => (
                  <SelectItem key={turno.id} value={turno.id}>
                    {turno.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.turno_id && (
              <p className="text-sm text-destructive">{errors.turno_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipamento_id">Segmento Afetado *</Label>
            <Select
              value={watch('equipamento_id')}
              onValueChange={(value) => setValue('equipamento_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {equipamentos?.map((equip) => (
                  <SelectItem key={equip.id} value={equip.id}>
                    {equip.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.equipamento_id && (
              <p className="text-sm text-destructive">{errors.equipamento_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Tempo de Parada (minutos) *</Label>
            <Input
              id="duracao"
              type="number"
              min="1"
              {...register('duracao', { valueAsNumber: true })}
              placeholder="Ex: 30"
            />
            {errors.duracao && (
              <p className="text-sm text-destructive">{errors.duracao.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={watch('categoria')}
              onValueChange={(value) => setValue('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao_planejada">Não Planejada</SelectItem>
                <SelectItem value="planejada">Planejada</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="setup">Setup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              {...register('motivo')}
              placeholder="Descreva o motivo da parada"
              rows={2}
            />
            {errors.motivo && (
              <p className="text-sm text-destructive">{errors.motivo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Descreva detalhes adicionais sobre a parada..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParadaForm;
