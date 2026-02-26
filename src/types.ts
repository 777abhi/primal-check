export interface ScreenshotConfig {
  enabled: boolean;
  directory?: string;
  onFailure?: boolean;
  onSuccess?: boolean;
}

export interface NetworkChaosConfig {
  enabled: boolean;
  offline?: boolean;
  latency?: number; // ms
  requestFailureRate?: number; // 0.0 to 1.0
}

export interface AccessibilityConfig {
  enabled: boolean;
  failOnViolation?: boolean;
}

export interface SiteConfig {
  name: string;
  url: string;
  screenshotConfig?: ScreenshotConfig;
  networkChaosConfig?: NetworkChaosConfig;
  accessibilityConfig?: AccessibilityConfig;
}

export enum ExecutionMode {
  READ_ONLY = 'READ_ONLY',
  GORILLA = 'GORILLA',
}
