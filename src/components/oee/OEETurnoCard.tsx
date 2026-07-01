import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { OEETurno } from '@/hooks/useOEEPorTurno';
import { useUpdateMetaOEE } from '@/hooks/useTurnos';
import { getOEEColor, getOEELevel } from '@/types/oee';
import { cn } from '@/lib/utils';
import { AlertTriangle, Target, TrendingUp, TrendingDown, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface OEETurnoCardProps {
  turno: OEETurno;
}

const OEETurnoCard = ({ turno }: OEETurnoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [metaValue, setMetaValue] = useState(turno.meta_oee.toString());
  const updateMeta = useUpdateMetaOEE();

  const oeeColor = getOEEColor(turno.oee);
  const oeeLevel = getOEELevel(turno.oee);
  const gap = turno.oee - turno.meta_oee;
  const progressPercent = turno.meta_oee > 0 ? Math.min((turno.oee / turno.meta_oee) * 100, 100) : 0;
  const atingiuMeta = turno.oee >= turno.meta_oee;

  const handleSaveMeta = async () => {
    const newMeta = parseFloat(metaValue);
    if (isNaN(newMeta) || newMeta < 0 || newMeta > 100) {
      toast.error('Meta deve ser entre 0 e 100');
      return;
    }
    
    try {
      await updateMeta.mutateAsync({ turnoId: turno.turno_id, metaOee: newMeta });
      toast.success('Meta atualizada');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao atualizar meta');
    }
  };

  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{turno.turno_nome}</CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "font-semibold",
              turno.oee >= 85 && "bg-success/10 text-success border-success/20",
              turno.oee >= 65 && turno.oee < 85 && "bg-warning/10 text-warning border-warning/20",
              turno.oee < 65 && "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {oeeLevel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold" style={{ color: oeeColor }}>
            {turno.oee}%
          </span>
          <span className="text-sm text-muted-foreground">
            {turno.total_registros} registro{turno.total_registros !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Meta e Progresso */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input 
                    type="number"
                    value={metaValue}
                    onChange={(e) => setMetaValue(e.target.value)}
                    className="h-7 w-16 text-sm"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm">%</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveMeta}>
                    <Check className="h-3 w-3 text-success" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(false)}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Meta: {turno.meta_oee}%</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-5 w-5" 
                    onClick={() => {
                      setMetaValue(turno.meta_oee.toString());
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              atingiuMeta ? "text-success" : "text-destructive"
            )}>
              {atingiuMeta ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>+{gap.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" />
                  <span>{gap.toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-2",
              atingiuMeta ? "[&>div]:bg-success" : "[&>div]:bg-warning"
            )}
          />
          {!atingiuMeta && turno.total_registros > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Faltam {Math.abs(gap).toFixed(1)}% para atingir a meta
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 rounded-lg bg-info/10">
            <p className="text-xs text-muted-foreground">Disp.</p>
            <p className="font-semibold text-info">{turno.disponibilidade}%</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-warning/10">
            <p className="text-xs text-muted-foreground">Perf.</p>
            <p className="font-semibold text-warning">{turno.performance}%</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-success/10">
            <p className="text-xs text-muted-foreground">Qual.</p>
            <p className="font-semibold text-success">{turno.qualidade}%</p>
          </div>
        </div>

        {turno.total_paradas_min > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3 text-warning" />
            <span>{turno.total_paradas_min} min de paradas</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OEETurnoCard;
