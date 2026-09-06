/**
 * PeoplePay360 — Payslip PDF Generator
 * Uses PDFKit to produce a professional payslip document.
 *
 * The PDF renders already-computed server-side data.
 * It never recalculates salary.
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/env';

interface PayslipData {
  id: string;
  employee: {
    employeeCode: string;
    name: string;
    email: string;
    department?: string | null;
    designation?: string | null;
  };
  payrun: {
    name: string;
    periodStart: Date;
    periodEnd: Date;
  };
  gross: number | { toNumber: () => number };
  totalDeductions: number | { toNumber: () => number };
  net: number | { toNumber: () => number };
  lines: Array<{
    code: string;
    name: string;
    category: string;
    sequence: number;
    amount: number | { toNumber: () => number };
    formulaDescription?: string | null;
    inputValues: Record<string, number> | object;
  }>;
}

const toNum = (v: number | { toNumber: () => number }): number =>
  typeof v === 'object' && 'toNumber' in v ? v.toNumber() : (v as number);

export async function generatePayslipPdf(payslip: PayslipData): Promise<string> {
  const outputDir = path.join(process.cwd(), 'generated', 'payslips');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `payslip-${payslip.employee.employeeCode}-${payslip.payrun.periodStart.toISOString().slice(0, 7)}.pdf`;
  const outputPath = path.join(outputDir, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(config.companyName, { align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica')
      .text('PAY SLIP', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .text(
        `Period: ${formatDate(payslip.payrun.periodStart)} – ${formatDate(payslip.payrun.periodEnd)}`,
        { align: 'center' }
      );

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // ── Employee Info ────────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').text('Employee Details');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    const empDetails = [
      ['Employee ID', payslip.employee.employeeCode],
      ['Name', payslip.employee.name],
      ['Email', payslip.employee.email],
      ['Department', payslip.employee.department ?? '—'],
      ['Designation', payslip.employee.designation ?? '—'],
    ];

    for (const [label, value] of empDetails) {
      doc.text(`${label}:`, { continued: true, width: 150 });
      doc.text(`  ${value}`);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // ── Earnings ─────────────────────────────────────────────────────────────
    const earningLines = payslip.lines
      .filter((l) => l.category === 'EARNING' && l.code !== 'GROSS')
      .sort((a, b) => a.sequence - b.sequence);

    doc.fontSize(11).font('Helvetica-Bold').text('EARNINGS');
    doc.moveDown(0.3);

    for (const line of earningLines) {
      doc.fontSize(10).font('Helvetica');
      doc.text(line.name, { continued: true, width: 300 });
      doc.text(`₹${toNum(line.amount).toFixed(2)}`, { align: 'right' });

      if (line.formulaDescription) {
        doc.fontSize(8).fillColor('#666666');
        const inputs = line.inputValues as Record<string, number>;
        const inputStr = Object.entries(inputs)
          .map(([k, v]) => `${k} = ₹${Number(v).toFixed(2)}`)
          .join(', ');
        if (inputStr) doc.text(`  Input: ${inputStr}`);
        doc.text(`  Formula: ${line.formulaDescription}`);
        doc.fillColor('#000000').fontSize(10);
      }
    }

    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Gross Salary', { continued: true, width: 300 });
    doc.text(`₹${toNum(payslip.gross).toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica');

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // ── Deductions ────────────────────────────────────────────────────────────
    const deductionLines = payslip.lines
      .filter((l) => l.category === 'DEDUCTION')
      .sort((a, b) => a.sequence - b.sequence);

    doc.fontSize(11).font('Helvetica-Bold').text('DEDUCTIONS');
    doc.moveDown(0.3);

    for (const line of deductionLines) {
      doc.fontSize(10).font('Helvetica');
      doc.text(line.name, { continued: true, width: 300 });
      doc.text(`₹${toNum(line.amount).toFixed(2)}`, { align: 'right' });

      if (line.formulaDescription) {
        doc.fontSize(8).fillColor('#666666');
        const inputs = line.inputValues as Record<string, number>;
        const inputStr = Object.entries(inputs)
          .map(([k, v]) => `${k} = ₹${Number(v).toFixed(2)}`)
          .join(', ');
        if (inputStr) doc.text(`  Input: ${inputStr}`);
        doc.text(`  Formula: ${line.formulaDescription}`);
        doc.fillColor('#000000').fontSize(10);
      }
    }

    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Total Deductions', { continued: true, width: 300 });
    doc.text(`₹${toNum(payslip.totalDeductions).toFixed(2)}`, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000000').stroke();
    doc.moveDown();

    // ── Net Pay ───────────────────────────────────────────────────────────────
    doc.fontSize(13).font('Helvetica-Bold');
    doc.text('NET PAY', { continued: true, width: 300 });
    doc.text(`₹${toNum(payslip.net).toFixed(2)}`, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#888888')
      .text(`Generated by ${config.companyName} on ${new Date().toLocaleDateString()}`, {
        align: 'center',
      });

    doc.text('This is a computer-generated document. No signature required.', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}
