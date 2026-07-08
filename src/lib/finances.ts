// src/lib/finances.ts
import type { Database } from "~/types/database";

export type FinanceExpense = Database["public"]["Tables"]["expenses"]["Row"];
export type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

export type SettlementStatus = "pending" | "confirmed" | "rejected";

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const isLegacySettlement = (expense: FinanceExpense): boolean =>
  expense.description.trim().toLowerCase() === "spłata długu";

export const isSettlementEntry = (expense: FinanceExpense): boolean =>
  expense.entry_type === "settlement" || (!expense.entry_type && isLegacySettlement(expense));

export const getSettlementRecipientId = (expense: FinanceExpense): string | null =>
  expense.settlement_recipient_id ?? expense.split_among[0] ?? null;

export const getSettlementStatus = (expense: FinanceExpense): SettlementStatus | null => {
  if (!isSettlementEntry(expense)) return null;
  return (expense.settlement_status as SettlementStatus) ?? "confirmed";
};

export function calculateFinances(expenses: FinanceExpense[], users: User[]) {
  // 1. Zwykłe Saldo Netto (dla głównego wyniku "+101.06 PLN")
  const balances: Record<string, number> = Object.fromEntries(users.map((user) => [user.id, 0]));

  // 2. Macierz Długów Bezpośrednich 1:1 (Kto dokładnie komu wisi)
  const matrix: Record<string, Record<string, number>> = {};
  users.forEach((u) => {
    matrix[u.id] = {};
    users.forEach((u2) => {
      matrix[u.id]![u2.id] = 0;
    });
  });

  for (const expense of expenses) {
    const amount = Number(expense.amount);

    if (!Number.isFinite(amount) || amount <= 0) continue;

    // A) PRZETWARZANIE SPŁAT (Przelewy)
    if (isSettlementEntry(expense)) {
      const recipientId = getSettlementRecipientId(expense); // Wierzyciel
      const settlementStatus = getSettlementStatus(expense);
      const payerId = expense.user_id; // Dłużnik spłacający swój dług

      if (!recipientId || settlementStatus !== "confirmed") continue;

      balances[payerId] = roundMoney((balances[payerId] ?? 0) + amount);
      balances[recipientId] = roundMoney((balances[recipientId] ?? 0) - amount);

      // Aktualizacja bezpośredniego długu
      if (matrix[recipientId] && matrix[payerId]) {
        matrix[recipientId]![payerId] = roundMoney((matrix[recipientId]![payerId] ?? 0) - amount);
        matrix[payerId]![recipientId] = roundMoney((matrix[payerId]![recipientId] ?? 0) + amount);
      }
      continue;
    }

    // B) PRZETWARZANIE ZWYKŁYCH WYDATKÓW
    const payerId = expense.user_id;
    const participants = expense.split_among.filter(Boolean);

    if (participants.length === 0) continue;

    const share = amount / participants.length;

    // Saldo netto dla płatnika
    balances[payerId] = roundMoney((balances[payerId] ?? 0) + amount);

    for (const participantId of participants) {
      // Saldo netto dla uczestnika
      balances[participantId] = roundMoney((balances[participantId] ?? 0) - share);

      // Jeżeli uczestnik to nie płatnik -> Rośnie mu dług u Płatnika w macierzy
      if (participantId !== payerId && matrix[payerId] && matrix[participantId]) {
        matrix[payerId]![participantId] = roundMoney(
          (matrix[payerId]![participantId] ?? 0) + share,
        );
        matrix[participantId]![payerId] = roundMoney(
          (matrix[participantId]![payerId] ?? 0) - share,
        );
      }
    }
  }

  // 3. Generowanie transakcji TYLKO na podstawie rzeczywistych relacji
  const transactions: Transaction[] = [];
  for (const creditorId of Object.keys(matrix)) {
    for (const debtorId of Object.keys(matrix[creditorId]!)) {
      const amount = matrix[creditorId]![debtorId] ?? 0;
      // Jeśli bilans między tą dwójką jest dodatni dla Wierzyciela (Dłużnik mu faktycznie wisi)
      if (amount >= 0.01) {
        transactions.push({
          from: debtorId,
          to: creditorId,
          amount: roundMoney(amount),
        });
      }
    }
  }

  const roundedBalances = Object.fromEntries(
    Object.entries(balances).map(([id, balance]) => [id, roundMoney(balance)]),
  );

  return { balances: roundedBalances, transactions };
}
