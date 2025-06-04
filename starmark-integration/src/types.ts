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

// Extend the global Window interface
declare global {
  interface Window {
    starmarkFeedbackModal?: StarMarkFeedbackModal;
    starmarkFeedbackWidget?: StarMarkFeedbackWidget;
  }
}
