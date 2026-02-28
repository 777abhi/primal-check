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

export interface StorageFuzzingConfig {
  enabled: boolean;
}

export interface NetworkTrafficConfig {
  enabled: boolean;
  slowRequestThreshold?: number; // ms
  largePayloadThreshold?: number; // bytes
  failOnIssues?: boolean;
}

export interface SiteConfig {
  name: string;
  url: string;
  screenshotConfig?: ScreenshotConfig;
  networkChaosConfig?: NetworkChaosConfig;
  accessibilityConfig?: AccessibilityConfig;
  storageFuzzingConfig?: StorageFuzzingConfig;
  networkTrafficConfig?: NetworkTrafficConfig;
}

export enum ExecutionMode {
  READ_ONLY = 'READ_ONLY',
  GORILLA = 'GORILLA',
}
