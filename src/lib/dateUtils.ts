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
