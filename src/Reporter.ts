import { SiteConfig, ExecutionMode } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class Reporter {
  static generate(config: SiteConfig, mode: ExecutionMode, success: boolean, errors: Error[]): void {
    if (!config.reportConfig || !config.reportConfig.enabled) {
      return;
    }

    const dir = config.reportConfig.directory || './reports';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const status = success ? 'success' : 'failure';
    const sanitizedName = config.name.replace(/[^a-z0-9]/gi, '_');
    const filename = `${sanitizedName}-${mode}-${status}-${timestamp}.html`;
    const fullPath = path.join(dir, filename);

    const errorListHtml = errors.length > 0
      ? `<ul>${errors.map(e => `<li>${e.message}</li>`).join('')}</ul>`
      : '<p>No errors recorded.</p>';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Primal Check Report - ${config.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .failure { color: red; }
        .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
        .errors { background-color: #f9f9f9; border-left: 4px solid red; padding: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Primal Check Report</h1>
        <p><strong>Site Name:</strong> ${config.name}</p>
        <p><strong>URL:</strong> <a href="${config.url}" target="_blank">${config.url}</a></p>
        <p><strong>Mode:</strong> ${mode}</p>
        <p><strong>Status:</strong> <span class="${status}">${status.toUpperCase()}</span></p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    </div>

    ${errors.length > 0 ? `<div class="errors"><h2>Errors</h2>${errorListHtml}</div>` : ''}
</body>
</html>
    `.trim();

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, html, 'utf-8');
    } catch (e) {
      console.error(`Failed to generate HTML report:`, e);
    }
  }
}
