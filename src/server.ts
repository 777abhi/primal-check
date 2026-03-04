import * as http from 'http';
import { chromium } from 'playwright';
import { PrimalEngine } from './PrimalEngine';
import { SiteConfig, ExecutionMode } from './types';

export function startServer(port: number = 3000): http.Server {
    const server = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/run') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
                let payload;
                try {
                    payload = JSON.parse(body);
                } catch (err: any) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                    return;
                }

                try {
                    const config: SiteConfig = payload.config;
                    const mode: ExecutionMode = payload.mode || ExecutionMode.READ_ONLY;

                    const browser = await chromium.launch({ headless: true });
                    const context = await browser.newContext();
                    const page = await context.newPage();
                    const engine = new PrimalEngine(page);

                    try {
                        await engine.run(config, mode);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } catch (err: any) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: err.message }));
                    } finally {
                        await browser.close();
                    }
                } catch (err: any) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Server error during execution' }));
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(port, () => console.log(`Primal Check Server listening on port ${port}`));
    return server;
}
