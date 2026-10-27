export type PageId =
  | 'Dashboard'
  | 'Timetable'
  | 'Tasks & Exams'
  | 'Calendar'
  | 'Reminders'
  | 'Focus Timer'
  | 'Desktop Pet'
  | 'Settings'
export interface ClassSchedule {
  id: string
  course: string
  day: number
  startTime: string
  endTime: string
  location: string
  teacher: string
  color: string
}
export interface StudyTask {
  id: string
  title: string
  description: string
  course: string
  category: 'homework' | 'quiz' | 'exam'
  dueDate: string
  dueTime: string
  createdAt: string
  completed: boolean
}
export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: string
  end: string
  allDay: boolean
  color: string
  importKey?: string
}
export interface Reminder {
  id: string
  sourceType: 'task' | 'event'
  sourceId: string
  title: string
  dueAt: number
  notifyAt: number
  status: 'pending' | 'delivered' | 'dismissed' | 'missed'
}
export interface FocusSettings {
  studyMinutes: number
  breakMinutes: number
  rounds: number
}
export interface FocusSession {
  id: string
  settings: FocusSettings
  state: 'idle' | 'running' | 'paused' | 'completed'
  phase: 'study' | 'break'
  round: number
  endsAt: number | null
  remainingMs: number
}
export interface FocusPeriod {
  id: string
  sessionId: string
  round: number
  completedAt: number
  durationMs: number
}
export const petIds = ['forest-fairy'] as const
export type PetId = (typeof petIds)[number]
export const leadTimes = [0, 30, 60, 1440, 2880] as const
export interface AppSettings {
  pet: PetId
  remindersEnabled: boolean
  reminderLeadMinutes: number
  focus: FocusSettings
}
export interface AppData {
  schemaVersion: 1
  classes: ClassSchedule[]
  tasks: StudyTask[]
  events: CalendarEvent[]
  reminders: Reminder[]
  focusHistory: FocusPeriod[]
  focusSession: FocusSession | null
  settings: AppSettings
}
export interface AppSnapshot {
  data: AppData
  version: string
  warning: string | null
  notificationSupported: boolean
}
export type Command =
  | { type: 'class.save'; value: ClassSchedule }
  | { type: 'class.delete'; id: string }
  | { type: 'task.save'; value: StudyTask }
  | { type: 'task.delete'; id: string }
  | { type: 'event.save'; value: CalendarEvent }
  | { type: 'event.delete'; id: string }
  | { type: 'events.import'; values: CalendarEvent[] }
  | { type: 'settings.save'; value: AppSettings }
  | { type: 'reminder.dismiss'; id: string }
  | { type: 'focus.start'; settings: FocusSettings }
  | { type: 'focus.pause' | 'focus.resume' | 'focus.restart' }
export interface CompanionAPI {
  snapshot(): Promise<AppSnapshot>
  dispatch(command: Command): Promise<AppSnapshot>
  subscribe(listener: (snapshot: AppSnapshot) => void): () => void
  pet(show: boolean): Promise<void>
}
export function defaults(): AppData {
  return {
    schemaVersion: 1,
    classes: [],
    tasks: [],
    events: [],
    reminders: [],
    focusHistory: [],
    focusSession: null,
    settings: {
      pet: 'forest-fairy',
      remindersEnabled: true,
      reminderLeadMinutes: 30,
      focus: { studyMinutes: 25, breakMinutes: 5, rounds: 4 }
    }
  }
}
