import { escapeJS } from "../utils.js";

/**
 * Build a JXA Date expression from a date string, or null.
 */
function jxaDateExpr(dateStr?: string): string {
  if (!dateStr) return "null";
  return `new Date("${escapeJS(dateStr)}")`;
}

/**
 * Create a new reminder.
 */
export function createReminderScript(options: {
  title: string;
  notes?: string;
  listName?: string;
  dueDate?: string;
  remindMeDate?: string;
  priority?: number;
  flagged?: boolean;
}): string {
  const {
    title,
    notes,
    listName,
    dueDate,
    remindMeDate,
    priority,
    flagged,
  } = options;

  const props: string[] = [`name: "${escapeJS(title)}"`];
  if (notes) props.push(`body: "${escapeJS(notes)}"`);
  if (dueDate) props.push(`dueDate: ${jxaDateExpr(dueDate)}`);
  if (remindMeDate) props.push(`remindMeDate: ${jxaDateExpr(remindMeDate)}`);
  if (priority !== undefined) props.push(`priority: ${priority}`);
  if (flagged !== undefined) props.push(`flagged: ${flagged}`);

  const containerExpr = listName
    ? `app.lists.byName("${escapeJS(listName)}")`
    : `app.defaultList()`;

  return `
    var app = Application("Reminders");
    var container = ${containerExpr};
    var r = app.Reminder({${props.join(", ")}});
    container.reminders.push(r);
    JSON.stringify({ id: r.id(), name: r.name() });
  `;
}

/**
 * Update an existing reminder.
 */
export function updateReminderScript(options: {
  id: string;
  title?: string;
  notes?: string;
  dueDate?: string;
  remindMeDate?: string;
  priority?: number;
  flagged?: boolean;
}): string {
  const { id, title, notes, dueDate, remindMeDate, priority, flagged } =
    options;

  const updates: string[] = [];
  if (title !== undefined) updates.push(`r.name = "${escapeJS(title)}";`);
  if (notes !== undefined) updates.push(`r.body = "${escapeJS(notes)}";`);
  if (dueDate !== undefined) updates.push(`r.dueDate = ${jxaDateExpr(dueDate)};`);
  if (remindMeDate !== undefined)
    updates.push(`r.remindMeDate = ${jxaDateExpr(remindMeDate)};`);
  if (priority !== undefined) updates.push(`r.priority = ${priority};`);
  if (flagged !== undefined) updates.push(`r.flagged = ${flagged};`);

  return `
    var app = Application("Reminders");
    var rems = app.reminders.whose({id: {"=": "${escapeJS(id)}"}});
    if (rems.length === 0) throw new Error("Reminder not found: ${escapeJS(id)}");
    var r = rems[0];
    ${updates.join("\n    ")}
    JSON.stringify({ success: true, id: r.id(), name: r.name() });
  `;
}

/**
 * Complete a reminder.
 */
export function completeReminderScript(id: string): string {
  return `
    var app = Application("Reminders");
    var rems = app.reminders.whose({id: {"=": "${escapeJS(id)}"}});
    if (rems.length === 0) throw new Error("Reminder not found: ${escapeJS(id)}");
    var r = rems[0];
    r.completed = true;
    JSON.stringify({ success: true, id: r.id(), name: r.name() });
  `;
}

/**
 * Delete a reminder.
 */
export function deleteReminderScript(id: string): string {
  return `
    var app = Application("Reminders");
    var rems = app.reminders.whose({id: {"=": "${escapeJS(id)}"}});
    if (rems.length === 0) throw new Error("Reminder not found: ${escapeJS(id)}");
    var r = rems[0];
    var name = r.name();
    var rid = r.id();
    app.delete(r);
    JSON.stringify({ success: true, id: rid, name: name });
  `;
}
