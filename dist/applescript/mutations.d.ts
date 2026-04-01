/**
 * Create a new reminder.
 */
export declare function createReminderScript(options: {
    title: string;
    notes?: string;
    listName?: string;
    dueDate?: string;
    remindMeDate?: string;
    priority?: number;
    flagged?: boolean;
}): string;
/**
 * Update an existing reminder.
 */
export declare function updateReminderScript(options: {
    id: string;
    title?: string;
    notes?: string;
    dueDate?: string;
    remindMeDate?: string;
    priority?: number;
    flagged?: boolean;
}): string;
/**
 * Complete a reminder.
 */
export declare function completeReminderScript(id: string): string;
/**
 * Delete a reminder.
 */
export declare function deleteReminderScript(id: string): string;
