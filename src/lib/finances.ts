/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { Database } from "~/types/database";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

export type SettlementStatus = "pending" | "confirmed" | "rejected";

// ✅ Czyste nadpisanie typów. Wywalamy konfliktowe pola, wstawiamy własne.
// (string & {}) sprawia, że TS przyjmie dane z bazy bez błędów,
// a my wciąż mamy autouzupełnianie np. "expense" | "settlement".
export type FinanceExpense = Omit<Expense, "entry_type" | "settlement_status"> & {
  entry_type: "expense" | "settlement" | (string & {});
  settlement_status: SettlementStatus | (string & {}) | null;
};

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const isLegacySettlement = (expense: FinanceExpense) =>
  expense.description.trim().toLowerCase() === "spłata długu";

export const isSettlementEntry = (expense: FinanceExpense) =>
  expense.entry_type === "settlement" || (!expense.entry_type && isLegacySettlement(expense));

export const getSettlementRecipientId = (expense: FinanceExpense) =>
  expense.settlement_recipient_id ?? expense.split_among[0] ?? null;

export const getSettlementStatus = (expense: FinanceExpense): SettlementStatus | null => {
  if (!isSettlementEntry(expense)) return null;
  return (expense.settlement_status as SettlementStatus) ?? "confirmed";
};

function calculateTransactions(balances: Record<string, number>): Transaction[] {
  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < -0.009)
    .map(([id, balance]) => ({
      id,
      amount: roundMoney(-balance),
    }));

  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0.009)
    .map(([id, balance]) => ({
      id,
      amount: roundMoney(balance),
    }));

  const transactions: Transaction[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    if (!debtor || !creditor) break;

    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      transactions.push({
        from: debtor.id,
        to: creditor.id,
        amount,
      });
    }

    debtor.amount = roundMoney(debtor.amount - amount);
    creditor.amount = roundMoney(creditor.amount - amount);

    if (debtor.amount < 0.009) debtorIndex += 1;
    if (creditor.amount < 0.009) creditorIndex += 1;
  }

  return transactions;
}

export function calculateFinances(expenses: FinanceExpense[], users: User[]) {
  const balances: Record<string, number> = Object.fromEntries(users.map((user) => [user.id, 0]));

  for (const expense of expenses) {
    const amount = Number(expense.amount);

    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (isSettlementEntry(expense)) {
      const recipientId = getSettlementRecipientId(expense);
      const settlementStatus = getSettlementStatus(expense);

      if (!recipientId || settlementStatus !== "confirmed") continue;

      balances[expense.user_id] = roundMoney((balances[expense.user_id] ?? 0) + amount);

      balances[recipientId] = roundMoney((balances[recipientId] ?? 0) - amount);

      continue;
    }

    const participants = expense.split_among.filter(Boolean);

    if (participants.length === 0) continue;

    const share = amount / participants.length;

    balances[expense.user_id] = roundMoney((balances[expense.user_id] ?? 0) + amount);

    for (const participantId of participants) {
      balances[participantId] = roundMoney((balances[participantId] ?? 0) - share);
    }
  }

  const roundedBalances = Object.fromEntries(
    Object.entries(balances).map(([id, balance]) => [id, roundMoney(balance)]),
  );

  return {
    balances: roundedBalances,
    transactions: calculateTransactions(roundedBalances),
  };
}
