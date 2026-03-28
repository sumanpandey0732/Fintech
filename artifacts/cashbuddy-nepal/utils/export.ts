import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Alert } from "react-native";
import { Transaction } from "@/context/AppContext";
import { CATEGORY_CONFIG, formatAmount, formatDate } from "@/constants/categories";

export async function exportTransactionsToCSV(transactions: Transaction[]): Promise<void> {
  if (Platform.OS === "web") {
    Alert.alert("Not Available", "Export is not available on web");
    return;
  }

  if (transactions.length === 0) {
    Alert.alert("No Data", "There are no transactions to export");
    return;
  }

  try {
    // Create CSV content
    const headers = ["Date", "Type", "Category", "Amount", "Note", "Recurring"];
    const rows = transactions.map((t) => [
      formatDate(t.date),
      t.type,
      CATEGORY_CONFIG[t.category]?.label ?? t.category,
      t.amount.toString(),
      `"${t.note.replace(/"/g, '""')}"`, // Escape quotes in notes
      t.recurring,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    // Generate filename with date
    const now = new Date();
    const filename = `cashbuddy_transactions_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.csv`;

    // Write to file
    const filePath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (sharingAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/csv",
        dialogTitle: "Export Transactions",
      });
    } else {
      Alert.alert("Export Ready", `File saved to: ${filePath}`);
    }
  } catch (error) {
    console.error("Export error:", error);
    Alert.alert("Export Failed", "Unable to export transactions. Please try again.");
  }
}

export async function exportMonthlySummary(
  transactions: Transaction[],
  balance: number,
  name: string
): Promise<void> {
  if (Platform.OS === "web") {
    Alert.alert("Not Available", "Export is not available on web");
    return;
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const income = monthlyTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = monthlyTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    monthlyTx.filter((t) => t.type === "expense").forEach((t) => {
      const label = CATEGORY_CONFIG[t.category]?.label ?? t.category;
      categoryBreakdown[label] = (categoryBreakdown[label] ?? 0) + t.amount;
    });

    const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    let reportContent = `CashBuddy Nepal - Monthly Report\n`;
    reportContent += `Generated for: ${name}\n`;
    reportContent += `Period: ${monthName}\n`;
    reportContent += `Generated on: ${now.toLocaleDateString()}\n\n`;
    reportContent += `=================================\n`;
    reportContent += `SUMMARY\n`;
    reportContent += `=================================\n`;
    reportContent += `Current Balance: ${formatAmount(balance)}\n`;
    reportContent += `Total Income: ${formatAmount(income)}\n`;
    reportContent += `Total Expenses: ${formatAmount(expenses)}\n`;
    reportContent += `Net Savings: ${formatAmount(income - expenses)}\n`;
    reportContent += `Savings Rate: ${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%\n\n`;
    reportContent += `=================================\n`;
    reportContent += `EXPENSE BREAKDOWN BY CATEGORY\n`;
    reportContent += `=================================\n`;

    Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, amt]) => {
        const pct = expenses > 0 ? ((amt / expenses) * 100).toFixed(1) : "0";
        reportContent += `${cat}: ${formatAmount(amt)} (${pct}%)\n`;
      });

    reportContent += `\n=================================\n`;
    reportContent += `TRANSACTIONS (${monthlyTx.length} total)\n`;
    reportContent += `=================================\n`;

    monthlyTx.slice(0, 20).forEach((t) => {
      const emoji = t.type === "income" ? "💚" : "💸";
      reportContent += `${emoji} ${formatDate(t.date)} - ${CATEGORY_CONFIG[t.category]?.label}: ${formatAmount(t.amount)}\n`;
      if (t.note) reportContent += `   Note: ${t.note}\n`;
    });

    if (monthlyTx.length > 20) {
      reportContent += `\n... and ${monthlyTx.length - 20} more transactions\n`;
    }

    const filename = `cashbuddy_report_${monthName.replace(" ", "_")}.txt`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, reportContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const sharingAvailable = await Sharing.isAvailableAsync();
    if (sharingAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/plain",
        dialogTitle: "Monthly Summary Report",
      });
    } else {
      Alert.alert("Report Ready", `File saved to: ${filePath}`);
    }
  } catch (error) {
    console.error("Export error:", error);
    Alert.alert("Export Failed", "Unable to generate report. Please try again.");
  }
}
