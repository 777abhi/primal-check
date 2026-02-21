/**
 * Represents the configuration for a site to be tested.
 */
export interface SiteConfig {
  /** The base URL of the site. */
  baseUrl: string;
  /**
   * A map of path names to their relative URLs.
   * Example: { home: '/', about: '/about' }
   */
  pathMaps: Record<string, string>;
  /**
   * Configuration for visual regression testing thresholds.
   * Can be a single number (default) or a map for specific paths.
   */
  visualThresholds: VisualThresholds;
}

/**
 * Defines thresholds for visual regression testing.
 */
export interface VisualThresholds {
  /** Default threshold for all pages (0 to 1). */
  default: number;
  /** Specific thresholds for certain paths. */
  [path: string]: number;
}

/**
 * Represents the storage state for a session.
 */
export interface SessionData {
  cookies?: Cookie[];
  localStorage?: LocalStorageItem[];
  sessionStorage?: LocalStorageItem[];
}

/**
 * Represents a browser cookie.
 */
export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Represents an item in local or session storage.
 */
export interface LocalStorageItem {
  key: string;
  value: string;
}

/**
 * The type of failure encountered during a test.
 */
export type TestFailureType = 'network' | 'console' | 'visual' | 'other';

/**
 * Represents the result of a test execution.
 */
export interface TestResult {
  /** Whether the test was successful. */
  success: boolean;
  /** The type of failure, if any. */
  type?: TestFailureType;
  /** A descriptive message about the result. */
  message: string;
  /** The URL where the test was executed. */
  url?: string;
  /** Additional details about the failure or success. */
  details?: unknown;
  /** Timestamp of the test execution. */
  timestamp: string;
}
