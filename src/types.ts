export interface SiteConfig {
  name: string;
  url: string;
}

export enum ExecutionMode {
  READ_ONLY = 'READ_ONLY',
  GORILLA = 'GORILLA',
}
