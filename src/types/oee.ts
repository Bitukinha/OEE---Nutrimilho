export interface ProductionData {
  id: string;
  date: string;
  shift: 'Manhã' | 'Tarde' | 'Noite';
  equipment: string;
  plannedTime: number; // minutos
  actualTime: number; // minutos
  idealCycleTime: number; // segundos por unidade
  actualCycleTime: number; // segundos por unidade
  totalProduced: number;
  goodUnits: number;
  defects: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface EquipmentStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'maintenance';
  currentOEE: number;
  lastUpdate: string;
}

export interface StopReason {
  id: string;
  reason: string;
  duration: number; // minutos
  category: 'planned' | 'unplanned' | 'quality';
  equipment: string;
  timestamp: string;
}

export type OEELevel = 'excellent' | 'good' | 'warning' | 'critical';

export const getOEELevel = (value: number): OEELevel => {
  if (value >= 85) return 'excellent';
  if (value >= 70) return 'good';
  if (value >= 50) return 'warning';
  return 'critical';
};

export const getOEEColor = (value: number): string => {
  const level = getOEELevel(value);
  const colors = {
    excellent: 'text-oee-excellent',
    good: 'text-oee-good',
    warning: 'text-oee-warning',
    critical: 'text-oee-critical',
  };
  return colors[level];
};

export const getOEEBgColor = (value: number): string => {
  const level = getOEELevel(value);
  const colors = {
    excellent: 'bg-oee-excellent',
    good: 'bg-oee-good',
    warning: 'bg-oee-warning',
    critical: 'bg-oee-critical',
  };
  return colors[level];
};
