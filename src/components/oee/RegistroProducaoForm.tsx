import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
import { useCreateRegistroProducao, RegistroProducaoInput } from '@/hooks/useRegistrosProducao';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import { useTurnos } from '@/hooks/useTurnos';
import { Plus } from 'lucide-react';

const registroSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  equipamento_id: z.string().min(1, 'Segmento é obrigatório'),
  turno_id: z.string().min(1, 'Turno é obrigatório'),
  tempo_planejado: z.number().min(1, 'Tempo planejado deve ser maior que 0'),
  tempo_real: z.number().min(0, 'Tempo real não pode ser negativo'),
  capacidade_hora: z.number().min(1, 'Capacidade deve ser maior que 0'),
  total_produzido: z.number().min(0, 'Total produzido não pode ser negativo'),
  unidades_boas: z.number().min(0, 'Unidades boas não pode ser negativo'),
  defeitos: z.number().min(0, 'Defeitos não pode ser negativo'),
  observacoes: z.string().optional(),
});

type RegistroFormData = z.infer<typeof registroSchema>;

const RegistroProducaoForm = () => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateRegistroProducao();
  const { data: equipamentos } = useEquipamentos();
  const { data: turnos } = useTurnos();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      data: format(new Date(), 'yyyy-MM-dd'),
      equipamento_id: '',
      turno_id: '',
      tempo_planejado: 720, // 12 horas em minutos
      tempo_real: 700,
      capacidade_hora: 100,
      total_produzido: 0,
      unidades_boas: 0,
      defeitos: 0,
      observacoes: '',
    },
  });

  const selectedEquipamentoId = watch('equipamento_id');
  const totalProduzido = watch('total_produzido');
  const unidadesBoas = watch('unidades_boas');

  // Auto-calculate defeitos
  const handleTotalChange = (value: number) => {
    setValue('total_produzido', value);
    if (unidadesBoas > value) {
      setValue('unidades_boas', value);
      setValue('defeitos', 0);
    } else {
      setValue('defeitos', value - unidadesBoas);
    }
  };

  const handleUnidadesBoasChange = (value: number) => {
    if (value > totalProduzido) {
      setValue('unidades_boas', totalProduzido);
      setValue('defeitos', 0);
    } else {
      setValue('unidades_boas', value);
      setValue('defeitos', totalProduzido - value);
    }
  };

  // Auto-fill capacidade when equipment is selected
  const handleEquipamentoChange = (id: string) => {
    setValue('equipamento_id', id);
    const equipamento = equipamentos?.find(e => e.id === id);
    if (equipamento && equipamento.capacidade_hora) {
      setValue('capacidade_hora', equipamento.capacidade_hora);
    }
  };

  const onSubmit = async (data: RegistroFormData) => {
    try {
      // Log para debug: verifica exatamente qual data está sendo enviada
      console.log('Form data antes de enviar:', data);
      console.log('Data value:', data.data, 'Type:', typeof data.data);
      
      // A data já vem como string do input type="date" (formato: YYYY-MM-DD)
      // Não fazemos conversão, apenas passamos direto
      await createMutation.mutateAsync(data as RegistroProducaoInput);
      setOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving registro:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Novo Registro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Novo Registro de Produção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" {...register('data')} />
              {errors.data && (
                <p className="text-sm text-destructive">{errors.data.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="turno">Turno *</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipamento">Segmento *</Label>
            <Select
              value={selectedEquipamentoId}
              onValueChange={handleEquipamentoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {equipamentos?.filter(e => e.status === 'ativo').map((equip) => (
                  <SelectItem key={equip.id} value={equip.id}>
                    {equip.nome} {equip.codigo && `(${equip.codigo})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.equipamento_id && (
              <p className="text-sm text-destructive">{errors.equipamento_id.message}</p>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Tempos</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempo_planejado">Tempo Planejado (min)</Label>
                <Input
                  id="tempo_planejado"
                  type="number"
                  {...register('tempo_planejado', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo_real">Tempo Real (min)</Label>
                <Input
                  id="tempo_real"
                  type="number"
                  {...register('tempo_real', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="capacidade_hora">Capacidade (un/hora)</Label>
                <Input
                  id="capacidade_hora"
                  type="number"
                  {...register('capacidade_hora', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Produção</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_produzido">Total Produzido</Label>
                <Input
                  id="total_produzido"
                  type="number"
                  value={totalProduzido}
                  onChange={(e) => handleTotalChange(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidades_boas">Unidades Boas</Label>
                <Input
                  id="unidades_boas"
                  type="number"
                  value={unidadesBoas}
                  onChange={(e) => handleUnidadesBoasChange(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defeitos">Defeitos</Label>
                <Input
                  id="defeitos"
                  type="number"
                  {...register('defeitos', { valueAsNumber: true })}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações sobre a produção..."
              rows={3}
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
              {createMutation.isPending ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistroProducaoForm;
