/**
 * Get all reminder lists.
 */
export declare function getListsScript(): string;
/**
 * Get reminders with optional filters.
 */
export declare function getRemindersScript(options: {
    listName?: string;
    completed?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}): string;
/**
 * Get a single reminder by ID.
 */
export declare function getReminderByIdScript(id: string): string;
