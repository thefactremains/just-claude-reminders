export interface Reminder {
    id: string;
    name: string;
    body: string | null;
    completed: boolean;
    completionDate: string | null;
    dueDate: string | null;
    remindMeDate: string | null;
    priority: number;
    flagged: boolean;
    list: string;
}
export interface ReminderList {
    id: string;
    name: string;
    color: string | null;
}
