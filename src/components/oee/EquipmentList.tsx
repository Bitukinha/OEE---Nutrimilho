import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { equipmentStatus } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { getOEEColor } from '@/types/oee';
import { Activity, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import OEEGauge from './OEEGauge';

const statusConfig = {
  running: {
    label: 'Em Operação',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
  stopped: {
    label: 'Parado',
    icon: AlertTriangle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  maintenance: {
    label: 'Manutenção',
    icon: Wrench,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

const EquipmentList = () => {
  return (
    <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Status dos Equipamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {equipmentStatus.map((equipment) => {
          const status = statusConfig[equipment.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={equipment.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <OEEGauge value={equipment.currentOEE} size="sm" showLabel={false} />
                <div>
                  <h4 className="font-medium text-foreground">{equipment.name}</h4>
                  <Badge variant="outline" className={cn("mt-1", status.className)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("text-2xl font-display font-bold", getOEEColor(equipment.currentOEE))}>
                  {equipment.currentOEE > 0 ? `${equipment.currentOEE}%` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Atualizado: {new Date(equipment.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EquipmentList;
