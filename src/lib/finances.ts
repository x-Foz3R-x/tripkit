import type { Database } from "~/types/database";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

export type Transaction = {
  from: string;
  to: string;
  amount: number;
};

export function calculateFinances(expenses: Expense[], users: User[]) {
  const graph: Record<string, Record<string, number>> = {};

  users.forEach((u1) => {
    graph[u1.id] = {};
    users.forEach((u2) => (graph[u1.id]![u2.id] = 0));
  });

  // Rozdzielanie rachunków
  expenses.forEach((exp) => {
    if (!exp.user_id || exp.split_among.length === 0) return;

    const payer = exp.user_id;
    const splitCount = exp.split_among.length;

    // Konwersja na grosze
    const totalCents = Math.round(exp.amount * 100);
    const baseShare = Math.floor(totalCents / splitCount);
    let remainder = totalCents % splitCount;

    exp.split_among.forEach((debtor) => {
      if (debtor !== payer) {
        let share = baseShare;
        // Rozdajemy resztę grosz-po-groszu, żeby suma idealnie zeszła się z bazą
        if (remainder > 0) {
          share += 1;
          remainder -= 1;
        }

        if (!!graph[debtor] && graph[debtor][payer] !== undefined) graph[debtor][payer] += share;
      }
    });
  });

  const transactions: Transaction[] = [];
  const userBalances: Record<string, number> = {};
  users.forEach((u) => (userBalances[u.id] = 0));

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const u1 = users[i]!.id;
      const u2 = users[j]!.id;

      const u1OwesU2 = graph[u1]![u2] ?? 0;
      const u2OwesU1 = graph[u2]![u1] ?? 0;

      const net = u1OwesU2 - u2OwesU1;

      if (net > 0) {
        // u1 wisi u2
        const finalAmount = net / 100;
        transactions.push({ from: u1, to: u2, amount: finalAmount });
        userBalances[u1]! -= finalAmount;
        userBalances[u2]! += finalAmount;
      } else if (net < 0) {
        // u2 wisi u1
        const finalAmount = Math.abs(net) / 100;
        transactions.push({ from: u2, to: u1, amount: finalAmount });
        userBalances[u2]! -= finalAmount;
        userBalances[u1]! += finalAmount;
      }
    }
  }

  // Zaokrąglenie salda ostatecznego
  Object.keys(userBalances).forEach((id) => {
    userBalances[id] = Math.round((userBalances[id] ?? 0) * 100) / 100;
  });

  return { balances: userBalances, transactions };
}
