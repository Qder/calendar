/** Payload for scheduling a one-shot local notification. id is a 32-bit int. */
export interface ScheduleRequest {
  id: number
  title: string
  body: string
  /** Absolute local Date when the notification should fire. */
  triggerAt: Date
}

export interface PendingNotification {
  id: number
  title: string
  body: string
  triggerAt: Date | null
}

/**
 * Platform-agnostic notification API.
 * Business / debug UI must depend only on this interface.
 */
export interface NotificationService {
  requestPermission(): Promise<boolean>
  schedule(req: ScheduleRequest): Promise<void>
  cancel(id: number): Promise<void>
  cancelAll(): Promise<void>
  listPending(): Promise<PendingNotification[]>
}
