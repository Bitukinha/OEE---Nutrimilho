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
import { useCreateProdutoBloqueado, ProdutoBloqueadoInput } from '@/hooks/useProdutosBloqueados';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import { useTurnos } from '@/hooks/useTurnos';
import { useMotivoBloqueios } from '@/hooks/useMotivos';
import { Plus, Loader2 } from 'lucide-react';

const produtoSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  turno_id: z.string().min(1, 'Turno é obrigatório'),
  equipamento_id: z.string().min(1, 'Segmento é obrigatório'),
  motivo_bloqueio: z.string().min(1, 'Motivo é obrigatório').max(200, 'Máximo 200 caracteres'),
  quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
  numero_lacre: z.string().optional(),
  destino: z.string().min(1, 'Destino é obrigatório').max(100, 'Máximo 100 caracteres'),
  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

const DESTINOS_COMUNS = [
  'Reprocesso',
  'Descarte',
  'Devolução Fornecedor',
  'Análise Laboratório',
  'Quarentena',
  'Venda como 2ª linha',
];

const ProdutoBloqueadoForm = () => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateProdutoBloqueado();
  const { data: equipamentos } = useEquipamentos();
  const { data: turnos } = useTurnos();
  const { data: motivos, isLoading: motivosLoading } = useMotivoBloqueios();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      data: format(new Date(), 'yyyy-MM-dd'),
      turno_id: '',
      equipamento_id: '',
      motivo_bloqueio: '',
      quantidade: 0,
      numero_lacre: '',
      destino: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      await createMutation.mutateAsync(data as ProdutoBloqueadoInput);
      setOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving produto bloqueado:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Bloqueio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Produto Bloqueado</DialogTitle>
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
              value={watch('equipamento_id')}
              onValueChange={(value) => setValue('equipamento_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {equipamentos?.filter(e => e.status === 'ativo').map((equip) => (
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
            <Label htmlFor="motivo_bloqueio">Motivo do Bloqueio *</Label>
            <Select
              value={watch('motivo_bloqueio')}
              onValueChange={(value) => setValue('motivo_bloqueio', value)}
            >
              <SelectTrigger>
                {motivosLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando motivos...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Selecione o motivo do bloqueio" />
                )}
              </SelectTrigger>
              <SelectContent>
                {motivos?.map((motivo) => (
                  <SelectItem key={motivo.id} value={motivo.nome}>
                    {motivo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.motivo_bloqueio && (
              <p className="text-sm text-destructive">{errors.motivo_bloqueio.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                {...register('quantidade', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.quantidade && (
                <p className="text-sm text-destructive">{errors.quantidade.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_lacre">Número do Lacre</Label>
              <Input
                id="numero_lacre"
                {...register('numero_lacre')}
                placeholder="Ex: LC-001234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destino">Destino do Material *</Label>
            <Select
              value={watch('destino')}
              onValueChange={(value) => setValue('destino', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent>
                {DESTINOS_COMUNS.map((destino) => (
                  <SelectItem key={destino} value={destino}>
                    {destino}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destino && (
              <p className="text-sm text-destructive">{errors.destino.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Informações adicionais..."
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
              {createMutation.isPending ? 'Salvando...' : 'Registrar Bloqueio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProdutoBloqueadoForm;
