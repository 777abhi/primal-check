export interface ScreenshotConfig {
  enabled: boolean;
  directory?: string;
  onFailure?: boolean;
  onSuccess?: boolean;
}

export interface SiteConfig {
  name: string;
  url: string;
  screenshotConfig?: ScreenshotConfig;
}

export enum ExecutionMode {
  READ_ONLY = 'READ_ONLY',
  GORILLA = 'GORILLA',
}
