import { Page, Request, Response } from '@playwright/test';
import { NetworkTrafficConfig } from './types';

export class NetworkTrafficAnalyzer {
  private page: Page;
  private config: NetworkTrafficConfig;
  private issues: string[] = [];
  private requestStartTimes: Map<Request, number> = new Map();

  constructor(page: Page, config: NetworkTrafficConfig) {
    this.page = page;
    this.config = config;
  }

  attachListeners() {
    if (!this.config.enabled) return;

    this.page.on('request', this.handleRequest);
    this.page.on('response', this.handleResponse);
    this.page.on('requestfinished', this.handleRequestFinished);
    this.page.on('requestfailed', this.handleRequestFailed);
  }

  detachListeners() {
    this.page.off('request', this.handleRequest);
    this.page.off('response', this.handleResponse);
    this.page.off('requestfinished', this.handleRequestFinished);
    this.page.off('requestfailed', this.handleRequestFailed);
  }

  private handleRequest = (request: Request) => {
    // request.timing() is more accurate than Date.now() if available later,
    // but the start time from timing is available only after response starts
    this.requestStartTimes.set(request, Date.now());
  }

  private handleRequestFinished = (request: Request) => {
    this.checkSlowRequest(request);
  }

  private handleRequestFailed = (request: Request) => {
    this.checkSlowRequest(request);
  }

  private checkSlowRequest(request: Request) {
    if (!this.config.slowRequestThreshold) {
      this.requestStartTimes.delete(request);
      return;
    }

    const startTime = this.requestStartTimes.get(request);

    // Playwright timing responseEnd is relative to request's startTime (absolute time)
    // but sometimes responseEnd is -1 or missing when intercepted
    // So we use request timing if available or fallback to Date.now()
    let duration = 0;
    const timing = request.timing();

    if (timing && timing.responseEnd > 0) {
       duration = timing.responseEnd;
    } else if (startTime) {
      duration = Date.now() - startTime;
    } else {
      return;
    }

    if (duration > this.config.slowRequestThreshold) {
      this.issues.push(`Slow request detected: ${request.url()} (${duration.toFixed(2)}ms)`);
    }

    this.requestStartTimes.delete(request);
  }

  private handleResponse = async (response: Response) => {
    try {
      const request = response.request();
      const url = request.url();

      // Skip data URIs or internal playwright requests
      if (url.startsWith('data:')) return;

      if (this.config.largePayloadThreshold !== undefined) {
        // We can get headers or buffer
        const headers = response.headers();
        const contentLength = headers['content-length'];

        let size = 0;
        if (contentLength) {
          size = parseInt(contentLength, 10);
        } else {
          // If no content-length header, attempt to read the body buffer
          try {
            const buffer = await response.body();
            size = buffer.length;
          } catch (e) {
             // Response body might not be available, ignore
          }
        }

        if (size > this.config.largePayloadThreshold) {
          this.issues.push(`Large payload detected: ${url} (${size} bytes)`);
        }
      }
    } catch (e) {
      // Ignore errors when processing responses (e.g. context closed)
    }
  }

  getIssues(): string[] {
    return this.issues;
  }

  throwIfIssues() {
    if (this.config.failOnIssues && this.issues.length > 0) {
      throw new Error(`Network Traffic Issues Detected:\n${this.issues.join('\n')}`);
    }
  }
}
