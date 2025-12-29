import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getOEEColor, getOEEBgColor } from '@/types/oee';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  suffix?: string;
  description?: string;
  trend?: number;
  borderColor?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  suffix = '%',
  description,
  trend,
  borderColor,
}: MetricCardProps) => {
  const colorClass = getOEEColor(value);
  const bgColorClass = getOEEBgColor(value);

  return (
    <Card 
      variant="metric" 
      className={cn(
        "overflow-hidden animate-fade-in",
        borderColor || bgColorClass.replace('bg-', 'border-l-')
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-4xl font-display font-bold", colorClass)}>
                {value.toFixed(1)}
              </span>
              <span className={cn("text-xl font-semibold", colorClass)}>
                {suffix}
              </span>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend !== undefined && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                trend >= 0 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            bgColorClass,
            "bg-opacity-15"
          )}>
            <Icon className={cn("h-6 w-6", colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
