import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runJXA } from "../utils.js";
import {
  createReminderScript,
  updateReminderScript,
  completeReminderScript,
  deleteReminderScript,
} from "../applescript/mutations.js";

export function registerWriteTools(server: McpServer): void {
  // ── Create Reminder ──────────────────────────────────────────────
  server.registerTool(
    "reminders_create_reminder",
    {
      title: "Create a reminder",
      description:
        "Create a new reminder in Apple Reminders.\n\n" +
        "Args:\n" +
        "  - title: Title of the reminder (required)\n" +
        "  - notes: Additional notes/description\n" +
        "  - listName: Name of the list to add to (uses default list if omitted)\n" +
        "  - dueDate: Due date in ISO 8601 format (e.g., '2026-04-11' or '2026-04-11T09:00:00')\n" +
        "  - remindMeDate: Alert date/time in ISO 8601 format\n" +
        "  - priority: 0 = none, 1 = high, 5 = medium, 9 = low\n" +
        "  - flagged: Whether to flag the reminder\n\n" +
        "Returns: { id, name } of the created reminder",
      inputSchema: z
        .object({
          title: z.string().describe("Title of the reminder"),
          notes: z
            .string()
            .optional()
            .describe("Additional notes/description"),
          listName: z
            .string()
            .optional()
            .describe(
              "Name of the list to add to (uses default list if omitted)"
            ),
          dueDate: z
            .string()
            .optional()
            .describe("Due date in ISO 8601 format (e.g., '2026-04-11')"),
          remindMeDate: z
            .string()
            .optional()
            .describe("Alert date/time in ISO 8601 format"),
          priority: z
            .number()
            .min(0)
            .max(9)
            .optional()
            .describe("0 = none, 1 = high, 5 = medium, 9 = low"),
          flagged: z
            .boolean()
            .optional()
            .describe("Whether to flag the reminder"),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await runJXA<{ id: string; name: string }>(
          createReminderScript({
            title: params.title,
            notes: params.notes,
            listName: params.listName,
            dueDate: params.dueDate,
            remindMeDate: params.remindMeDate,
            priority: params.priority,
            flagged: params.flagged,
          })
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (e) {
        return {
          content: [
            { type: "text", text: `Error: ${(e as Error).message}` },
          ],
          isError: true,
        };
      }
    }
  );

  // ── Update Reminder ──────────────────────────────────────────────
  server.registerTool(
    "reminders_update_reminder",
    {
      title: "Update a reminder",
      description:
        "Update an existing reminder in Apple Reminders by ID. Only provided fields are updated.\n\n" +
        "Args:\n" +
        "  - id: The unique ID of the reminder to update (required)\n" +
        "  - title: New title\n" +
        "  - notes: New notes (replaces existing)\n" +
        "  - dueDate: New due date in ISO 8601 format\n" +
        "  - remindMeDate: New alert date/time in ISO 8601 format\n" +
        "  - priority: 0 = none, 1 = high, 5 = medium, 9 = low\n" +
        "  - flagged: Whether to flag the reminder\n\n" +
        "Returns: { success, id, name }",
      inputSchema: z
        .object({
          id: z.string().describe("The unique ID of the reminder to update"),
          title: z.string().optional().describe("New title"),
          notes: z
            .string()
            .optional()
            .describe("New notes (replaces existing)"),
          dueDate: z
            .string()
            .optional()
            .describe("New due date in ISO 8601 format"),
          remindMeDate: z
            .string()
            .optional()
            .describe("New alert date/time in ISO 8601 format"),
          priority: z
            .number()
            .min(0)
            .max(9)
            .optional()
            .describe("0 = none, 1 = high, 5 = medium, 9 = low"),
          flagged: z.boolean().optional().describe("Whether to flag"),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await runJXA<{
          success: boolean;
          id: string;
          name: string;
        }>(
          updateReminderScript({
            id: params.id,
            title: params.title,
            notes: params.notes,
            dueDate: params.dueDate,
            remindMeDate: params.remindMeDate,
            priority: params.priority,
            flagged: params.flagged,
          })
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (e) {
        return {
          content: [
            { type: "text", text: `Error: ${(e as Error).message}` },
          ],
          isError: true,
        };
      }
    }
  );

  // ── Complete Reminder ────────────────────────────────────────────
  server.registerTool(
    "reminders_complete_reminder",
    {
      title: "Complete a reminder",
      description:
        "Mark a reminder as complete in Apple Reminders.\n\n" +
        "Args:\n" +
        "  - id: The unique ID of the reminder to complete (required)\n\n" +
        "Returns: { success, id, name }",
      inputSchema: z
        .object({
          id: z
            .string()
            .describe("The unique ID of the reminder to complete"),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await runJXA<{
          success: boolean;
          id: string;
          name: string;
        }>(completeReminderScript(params.id));
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (e) {
        return {
          content: [
            { type: "text", text: `Error: ${(e as Error).message}` },
          ],
          isError: true,
        };
      }
    }
  );

  // ── Delete Reminder ──────────────────────────────────────────────
  server.registerTool(
    "reminders_delete_reminder",
    {
      title: "Delete a reminder",
      description:
        "Permanently delete a reminder from Apple Reminders.\n\n" +
        "Args:\n" +
        "  - id: The unique ID of the reminder to delete (required)\n\n" +
        "Returns: { success, id, name }",
      inputSchema: z
        .object({
          id: z
            .string()
            .describe("The unique ID of the reminder to delete"),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await runJXA<{
          success: boolean;
          id: string;
          name: string;
        }>(deleteReminderScript(params.id));
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (e) {
        return {
          content: [
            { type: "text", text: `Error: ${(e as Error).message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
