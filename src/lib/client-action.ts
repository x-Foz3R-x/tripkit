export type ClientActionFailure = { ok: false; error: string };

export async function runClientAction<T extends { ok: boolean }>(
  action: () => Promise<T>,
  fallbackError = "Nie udało się zapisać zmiany. Spróbuj ponownie.",
): Promise<T | ClientActionFailure> {
  try {
    return await action();
  } catch (error) {
    console.error("Nieobsłużony błąd akcji klienta:", error);
    return {
      ok: false,
      error:
        typeof navigator !== "undefined" && !navigator.onLine
          ? "Brak połączenia z internetem. Zmiana nie została zapisana."
          : fallbackError,
    };
  }
}
