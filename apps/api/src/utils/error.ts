/**
 * Eine Utility-Funktion, die einen Fehler in einen lesbaren String konvertiert.
 * @param error Das gefangene Fehlerobjekt.
 * @returns Eine Fehlermeldungs-String.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  // Kann für Prisma-Fehler oder andere Objekte angepasst werden
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Ein unbekannter Fehler ist aufgetreten.';
}
