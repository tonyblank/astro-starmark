// Global window extensions for StarMark
export interface StarMarkFeedbackModal {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  cleanup: () => void;
}

export interface StarMarkFeedbackWidget {
  cleanup: () => void;
  initialized: boolean;
}

// Storage Connector Types
export interface StorageResult {
  success: boolean;
  id?: string;
  error?: Error;
  retryable?: boolean;
  metadata?: Record<string, any>;
}

export interface AnalyticsData {
  totalFeedback: number;
  categories: Record<string, number>;
  pageStats: Array<{ page: string; count: number }>;
  timeRange?: { start: Date; end: Date };
}

// Import FeedbackData from feedback-data.ts to avoid circular dependencies
import type { FeedbackData } from "./feedback-data";
export type { FeedbackData } from "./feedback-data";

export interface StorageConnector {
  name: string;
  store(feedback: FeedbackData): Promise<StorageResult>;
  health(): Promise<boolean>;
  detect(): Promise<boolean>;
  getAnalytics?(): Promise<AnalyticsData>;
}

// Extend the global Window interface
declare global {
  interface Window {
    starmarkFeedbackModal?: StarMarkFeedbackModal;
    starmarkFeedbackWidget?: StarMarkFeedbackWidget;
  }
}
