import { cn } from '@/lib/utils';
import { getOEEColor, getOEELevel } from '@/types/oee';

interface OEEGaugeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const OEEGauge = ({ value, size = 'md', showLabel = true, label = 'OEE' }: OEEGaugeProps) => {
  const sizeClasses = {
    sm: { container: 'w-24 h-24', text: 'text-xl', label: 'text-xs' },
    md: { container: 'w-40 h-40', text: 'text-4xl', label: 'text-sm' },
    lg: { container: 'w-56 h-56', text: 'text-5xl', label: 'text-base' },
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const colorClass = getOEEColor(value);
  const level = getOEELevel(value);

  const strokeColors = {
    excellent: '#2E7D32',
    good: '#7CB342',
    warning: '#F9A825',
    critical: '#D32F2F',
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size].container)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={strokeColors[level]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${strokeColors[level]}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display font-bold", sizeClasses[size].text, colorClass)}>
          {value.toFixed(1)}%
        </span>
        {showLabel && (
          <span className={cn("text-muted-foreground font-medium", sizeClasses[size].label)}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default OEEGauge;
