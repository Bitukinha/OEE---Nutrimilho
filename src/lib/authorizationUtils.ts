/**
 * Email do usuário autorizado a fazer alterações e exclusões
 */
const AUTHORIZED_EMAIL = 'jeannovaes040@gmail.com';

/**
 * Verifica se o email do usuário está autorizado para fazer alterações
 * @param userEmail - Email do usuário autenticado
 * @returns true se autorizado, false caso contrário
 */
export const isAuthorizedForChanges = (userEmail?: string | null): boolean => {
  if (!userEmail) return false;
  return userEmail.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();
};

/**
 * Lança erro se o usuário não estiver autorizado
 * @param userEmail - Email do usuário autenticado
 * @throws Error se não autorizado
 */
export const requireAuthorization = (userEmail?: string | null): void => {
  if (!isAuthorizedForChanges(userEmail)) {
    throw new Error(
      `Acesso negado. Apenas ${AUTHORIZED_EMAIL} pode fazer alterações. Seu email: ${userEmail || 'não autenticado'}`
    );
  }
};
