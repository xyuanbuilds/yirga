import type { ReactNode } from 'react';

export type FieldFeedbackTypes = 'error' | 'success' | 'warning';

export type FeedbackMessage = ReactNode[];

export interface FieldFeedback {
  type?: FieldFeedbackTypes;
  messages?: FeedbackMessage;
}
