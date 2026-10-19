/** How far ahead (from local today) to expand occurrences and schedule notifications. */
export const WINDOW_DAYS = 60

/**
 * Max OS notifications created for a single event during one rebuild.
 * When over, only the nearest (soonest) triggers are kept; remainder is dropped with a log.
 */
export const MAX_SCHEDULED = 64
