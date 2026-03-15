import { Page } from '@playwright/test';

export interface PrimalPlugin {
  name: string;
  run(page: Page): Promise<void>;
}

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

export interface SmartNavigationConfig {
  enabled: boolean;
  steps?: number; // Number of interactions
}

export interface ReportConfig {
  enabled: boolean;
  directory?: string;
}

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
}

export interface TracingConfig {
  enabled: boolean;
  directory?: string;
}

export interface VisualRegressionConfig {
  enabled: boolean;
  baselineDirectory?: string;
  diffDirectory?: string;
  failOnMismatch?: boolean;
  threshold?: number;
}

export interface ViewportChaosConfig {
  enabled: boolean;
}

export interface DeviceSwarmConfig {
  enabled: boolean;
  devices: string[];
  fuzzGeolocation?: boolean;
  fuzzPermissions?: boolean;
}

export interface DOMCheckpointConfig {
  enabled: boolean;
}

export interface SiteConfig {
  name: string;
  url: string;
  screenshotConfig?: ScreenshotConfig;
  networkChaosConfig?: NetworkChaosConfig;
  accessibilityConfig?: AccessibilityConfig;
  storageFuzzingConfig?: StorageFuzzingConfig;
  networkTrafficConfig?: NetworkTrafficConfig;
  smartNavigationConfig?: SmartNavigationConfig;
  reportConfig?: ReportConfig;
  webhookConfig?: WebhookConfig;
  tracingConfig?: TracingConfig;
  visualRegressionConfig?: VisualRegressionConfig;
  viewportChaosConfig?: ViewportChaosConfig;
  deviceSwarmConfig?: DeviceSwarmConfig;
  domCheckpointConfig?: DOMCheckpointConfig;
  plugins?: PrimalPlugin[];
  excludeSelectors?: string[];
}

export enum ExecutionMode {
  READ_ONLY = 'READ_ONLY',
  GORILLA = 'GORILLA',
}
