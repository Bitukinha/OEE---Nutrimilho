/**
 * Utility para garantir que datas sejam manipuladas corretamente sem problemas de timezone
 */

/**
 * Formata uma data ISO string (YYYY-MM-DD) sem conversão de timezone
 * Garante que a data seja preservada exatamente como inserida
 */
export function formatDateISO(date: Date | string): string {
  if (typeof date === 'string') {
    return date; // Se já é string ISO, retorna como está
  }
  
  // Se for Date object, formata sem conversão de timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse uma data ISO string preservando o dia exato
 * Evita conversões de timezone
 */
export function parseDateISO(dateStr: string): Date {
  // Trata string ISO como local date, não UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Converte "HH:MM" ou "HH:MM:SS" em minutos desde meia-noite */
function parseHoraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
}

export const TEMPO_PLANEJADO_TURNO_MINUTOS = 440;

/** Calcula duração do turno em minutos (suporta turnos que cruzam meia-noite) */
export function calcularDuracaoTurnoMinutos(horaInicio: string, horaFim: string): number {
  const inicio = parseHoraMinutos(horaInicio);
  const fim = parseHoraMinutos(horaFim);
  return fim > inicio ? fim - inicio : 24 * 60 - inicio + fim;
}

/** Retorna o tempo planejado do turno conforme o regime 6x1 de 440 minutos */
export function calcularTempoPlanejadoTurnoMinutos(horaInicio: string, horaFim: string): number {
  const duracao = calcularDuracaoTurnoMinutos(horaInicio, horaFim);
  return Math.min(Math.max(0, duracao), TEMPO_PLANEJADO_TURNO_MINUTOS);
}

/**
 * Dado um mês no formato "YYYY-MM" (valor de um <input type="month">), retorna o
 * intervalo de datas ISO daquele mês inteiro. Se o mês ainda não terminou (mês atual),
 * o fim do intervalo é limitado a hoje em vez do último dia do mês.
 */
export function getRangeDoMes(mesStr: string): { inicio: string; fim: string } {
  const [ano, mes] = mesStr.split('-').map(Number);
  const inicio = new Date(ano, mes - 1, 1);
  const ultimoDiaDoMes = new Date(ano, mes, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = ultimoDiaDoMes > hoje ? hoje : ultimoDiaDoMes;
  return { inicio: formatDateISO(inicio), fim: formatDateISO(fim) };
}

/** Calcula disponibilidade considerando que as paradas não podem ultrapassar o tempo planejado */
export function calcularDisponibilidadeComParadas(tempoPlanejadoMinutos: number, paradasMinutos: number): number {
  const planejado = Math.max(0, tempoPlanejadoMinutos);
  if (planejado <= 0) return 0;

  const paradas = Math.max(0, Math.min(paradasMinutos, planejado));
  const tempoDisponivel = Math.max(0, planejado - paradas);
  return Number(((tempoDisponivel / planejado) * 100).toFixed(1));
}
