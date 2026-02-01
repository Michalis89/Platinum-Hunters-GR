export type ContentPublicationType = 'article' | 'review';

export interface ContentPublishedEventDetail {
  type: ContentPublicationType;
}

export const CONTENT_PUBLISHED_EVENT = 'content:published';
