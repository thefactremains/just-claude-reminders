export interface Reminder {
  id: string;
  name: string;
  body: string | null;
  completed: boolean;
  completionDate: string | null;
  dueDate: string | null;
  remindMeDate: string | null;
  priority: number; // 0 = none, 1 = high, 5 = medium, 9 = low
  flagged: boolean;
  list: string;
}

export interface ReminderList {
  id: string;
  name: string;
  color: string | null;
}
