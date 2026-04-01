import { escapeJS } from "../utils.js";
/**
 * JXA serializer for a single reminder.
 */
const SERIALIZE_REMINDER = `
function serializeReminder(r) {
  var dd = r.dueDate();
  var rd = r.remindMeDate();
  var cd = r.completionDate();
  return {
    id: r.id(),
    name: r.name(),
    body: r.body() || null,
    completed: r.completed(),
    completionDate: cd ? cd.toISOString() : null,
    dueDate: dd ? dd.toISOString() : null,
    remindMeDate: rd ? rd.toISOString() : null,
    priority: r.priority(),
    flagged: r.flagged(),
    list: r.container().name()
  };
}
`;
/**
 * Get all reminder lists.
 */
export function getListsScript() {
    return `
    var app = Application("Reminders");
    var lists = app.lists();
    var result = [];
    for (var i = 0; i < lists.length; i++) {
      var l = lists[i];
      result.push({
        id: l.id(),
        name: l.name(),
        color: l.color() || null
      });
    }
    JSON.stringify(result);
  `;
}
/**
 * Get reminders with optional filters.
 */
export function getRemindersScript(options) {
    const { listName, completed, search, limit = 50, offset = 0 } = options;
    const listFilter = listName
        ? `var container = app.lists.byName("${escapeJS(listName)}"); var rems = container.reminders();`
        : `var rems = app.reminders();`;
    const completedFilter = completed === true
        ? `rems = rems.filter(function(r) { return r.completed(); });`
        : completed === false
            ? `rems = rems.filter(function(r) { return !r.completed(); });`
            : "";
    const searchFilter = search
        ? `rems = rems.filter(function(r) {
        var n = (r.name() || "").toLowerCase();
        var b = (r.body() || "").toLowerCase();
        var q = "${escapeJS(search.toLowerCase())}";
        return n.indexOf(q) !== -1 || b.indexOf(q) !== -1;
      });`
        : "";
    return `
    ${SERIALIZE_REMINDER}
    var app = Application("Reminders");
    ${listFilter}
    ${completedFilter}
    ${searchFilter}
    var total = rems.length;
    var start = Math.min(${offset}, total);
    var end = Math.min(start + ${limit}, total);
    var items = [];
    for (var i = start; i < end; i++) {
      items.push(serializeReminder(rems[i]));
    }
    JSON.stringify({
      items: items,
      total_available: total,
      offset: ${offset},
      limit: ${limit},
      has_more: end < total
    });
  `;
}
/**
 * Get a single reminder by ID.
 */
export function getReminderByIdScript(id) {
    return `
    ${SERIALIZE_REMINDER}
    var app = Application("Reminders");
    var rems = app.reminders.whose({id: {"=": "${escapeJS(id)}"}});
    if (rems.length === 0) throw new Error("Reminder not found: ${escapeJS(id)}");
    JSON.stringify(serializeReminder(rems[0]));
  `;
}
