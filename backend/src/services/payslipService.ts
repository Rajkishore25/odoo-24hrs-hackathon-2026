import { db } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";

export class PayslipService {
  /**
   * Retrieves single payslip with its explainable calculation lines.
   */
  static async getPayslipById(id: string) {
    const payslip = await db.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            email: true,
            department: true,
            designation: true,
            bankName: true,
            bankAccountNumber: true,
          },
        },
        payrun: {
          select: {
            id: true,
            name: true,
            periodStart: true,
            periodEnd: true,
            status: true,
          },
        },
        lines: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!payslip) {
      throw new AppError("Payslip not found", 404, "NOT_FOUND");
    }

    return payslip;
  }

  /**
   * Generates printable HTML representation of the explainable payslip.
   */
  static async getPayslipHtml(id: string): Promise<string> {
    const payslip = await this.getPayslipById(id);

    const earnings = payslip.lines.filter((l) => l.category === "EARNING");
    const deductions = payslip.lines.filter((l) => l.category === "DEDUCTION");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslip - ${payslip.employee.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; }
    .meta { font-size: 14px; color: #64748b; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1; font-size: 13px; color: #475569; }
    td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .amount { text-align: right; }
    .total-box { margin-top: 24px; border-top: 2px solid #0f172a; padding-top: 12px; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
    .formula { font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">PeoplePay360 — Official Payslip</div>
      <div class="meta">Payrun: ${payslip.payrun.name} (${payslip.payrun.periodStart.toISOString().split("T")[0]} to ${payslip.payrun.periodEnd.toISOString().split("T")[0]})</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${payslip.status}</span>
      <div class="meta" style="margin-top: 6px;">Generated on: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <strong>Employee Information</strong>
      <div style="margin-top: 8px; font-size: 14px; line-height: 1.6;">
        <div><strong>Name:</strong> ${payslip.employee.name} (${payslip.employee.employeeCode})</div>
        <div><strong>Department:</strong> ${payslip.employee.department || "General"}</div>
        <div><strong>Designation:</strong> ${payslip.employee.designation || "Staff"}</div>
      </div>
    </div>
    <div class="card">
      <strong>Payment & Bank Details</strong>
      <div style="margin-top: 8px; font-size: 14px; line-height: 1.6;">
        <div><strong>Bank:</strong> ${payslip.employee.bankName || "Direct Deposit"}</div>
        <div><strong>Account:</strong> ${payslip.employee.bankAccountNumber ? "••••" + payslip.employee.bankAccountNumber.slice(-4) : "On file"}</div>
      </div>
    </div>
  </div>

  <div class="grid">
    <div>
      <h3 style="margin-bottom: 8px; color: #16a34a;">Earnings</h3>
      <table>
        <thead>
          <tr>
            <th>Item & Formula</th>
            <th class="amount">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${earnings
            .map(
              (l) => `<tr>
              <td>
                <div>${l.name} (${l.code})</div>
                <div class="formula">${l.formulaDescription || ""}</div>
              </td>
              <td class="amount">${Number(l.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>`
            )
            .join("")}
          <tr style="font-weight: bold; background: #f0fdf4;">
            <td>Total Gross Earnings</td>
            <td class="amount">${Number(payslip.gross).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h3 style="margin-bottom: 8px; color: #dc2626;">Deductions</h3>
      <table>
        <thead>
          <tr>
            <th>Item & Formula</th>
            <th class="amount">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${deductions
            .map(
              (l) => `<tr>
              <td>
                <div>${l.name} (${l.code})</div>
                <div class="formula">${l.formulaDescription || ""}</div>
              </td>
              <td class="amount">${Number(l.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>`
            )
            .join("")}
          <tr style="font-weight: bold; background: #fef2f2;">
            <td>Total Deductions</td>
            <td class="amount">${Number(payslip.totalDeductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="total-box">
    <div>Net Take-Home Pay</div>
    <div>₹${Number(payslip.net).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
  </div>
</body>
</html>
    `;
  }
}

export default PayslipService;
