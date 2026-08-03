import * as Print from 'expo-print';
import type { MileageReportData } from '@milerecover/domain';
import { shareFile, type ShareResult } from './fileShare';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildReportHtml(report: MileageReportData): string {
  const rows = report.lineItems
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.dateLabel)}</td>
        <td>${escapeHtml(item.purpose)}</td>
        <td>${escapeHtml(item.startLabel)}</td>
        <td>${escapeHtml(item.endLabel)}</td>
        <td style="text-align:right">${item.distanceMiles.toFixed(1)}</td>
        <td>${escapeHtml(item.source)}</td>
        <td>${escapeHtml(item.evidence)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0B2E1F; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .meta { color: #3D4F45; font-size: 12px; margin-bottom: 16px; line-height: 1.5; }
    .summary { margin: 16px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border-bottom: 1px solid #D6E5DB; padding: 8px 6px; vertical-align: top; }
    th { text-align: left; color: #1B5538; }
    .disclaimer { margin-top: 20px; font-size: 10px; color: #5C6B63; line-height: 1.4; }
  </style>
</head>
<body>
  <h1>MileRecover</h1>
  <div class="meta">
    <div>${escapeHtml(report.title)}</div>
    <div>Driver: ${escapeHtml(report.userName ?? 'Not set')}</div>
    <div>Mileage use: ${escapeHtml(report.mileageUseType ?? 'Not set')}</div>
    <div>Period: ${escapeHtml(report.period.label)}</div>
    <div>Generated: ${escapeHtml(new Date(report.generatedAt).toLocaleString())}</div>
  </div>
  <div class="summary">
    <strong>${report.totalMiles.toFixed(1)}</strong> confirmed work miles ·
    <strong>${report.tripCount}</strong> drives
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Purpose</th><th>Start</th><th>Destination</th>
        <th>Miles</th><th>Source</th><th>Evidence</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7">No confirmed work drives in this period.</td></tr>'}
    </tbody>
  </table>
  <p class="disclaimer">${escapeHtml(report.disclaimer)}</p>
</body>
</html>`;
}

export async function generateAndSharePdf(report: MileageReportData): Promise<ShareResult> {
  if (report.tripCount === 0) {
    return {
      ok: false,
      reason: 'failed',
      message: 'No confirmed work drives in this period to export.',
    };
  }
  try {
    const html = buildReportHtml(report);
    const file = await Print.printToFileAsync({ html, base64: false });
    return shareFile(file.uri, 'application/pdf', 'Share MileRecover PDF');
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      message: error instanceof Error ? error.message : 'Could not generate PDF.',
    };
  }
}
