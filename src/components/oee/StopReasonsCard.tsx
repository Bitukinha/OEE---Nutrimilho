import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { stopReasons } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, Wrench, Target } from 'lucide-react';

const categoryConfig = {
  planned: {
    label: 'Planejada',
    icon: Clock,
    className: 'bg-info/10 text-info border-info/20',
  },
  unplanned: {
    label: 'Não Planejada',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  quality: {
    label: 'Qualidade',
    icon: Target,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

const StopReasonsCard = () => {
  return (
    <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Paradas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stopReasons.map((stop) => {
          const config = categoryConfig[stop.category];
          const CategoryIcon = config.icon;

          return (
            <div
              key={stop.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  stop.category === 'planned' && "bg-info/10",
                  stop.category === 'unplanned' && "bg-destructive/10",
                  stop.category === 'quality' && "bg-warning/10"
                )}>
                  <CategoryIcon className={cn(
                    "h-4 w-4",
                    stop.category === 'planned' && "text-info",
                    stop.category === 'unplanned' && "text-destructive",
                    stop.category === 'quality' && "text-warning"
                  )} />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{stop.reason}</p>
                  <p className="text-xs text-muted-foreground">{stop.equipment}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={cn("text-xs", config.className)}>
                  {config.label}
                </Badge>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {stop.duration} min
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StopReasonsCard;
