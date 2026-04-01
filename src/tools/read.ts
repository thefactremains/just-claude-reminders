import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runJXA } from "../utils.js";
import {
  getListsScript,
  getRemindersScript,
  getReminderByIdScript,
} from "../applescript/queries.js";
import type { Reminder, ReminderList } from "../types.js";

export function registerReadTools(server: McpServer): void {
  // ── Get Reminders (filtered, paginated) ──────────────────────────
  server.registerTool(
    "reminders_get_reminders",
    {
      title: "List reminders",
      description:
        "List reminders from Apple Reminders with optional filters and pagination.\n\n" +
        "Args:\n" +
        "  - listName: Filter by reminder list name\n" +
        "  - completed: Filter by completion status (true/false/omit for all)\n" +
        "  - search: Case-insensitive substring match against title and notes\n" +
        "  - limit: Max results to return (default 50, max 200)\n" +
        "  - offset: Number of results to skip for pagination (default 0)\n\n" +
        "Returns: { items: Reminder[], total_available, offset, limit, has_more }",
      inputSchema: z
        .object({
          listName: z
            .string()
            .optional()
            .describe("Filter by reminder list name"),
          completed: z
            .boolean()
            .optional()
            .describe("Filter by completion status"),
          search: z
            .string()
            .optional()
            .describe(
              "Case-insensitive substring match against title and notes"
            ),
          limit: z
            .number()
            .min(1)
            .max(200)
            .default(50)
            .optional()
            .describe("Max results to return (default 50)"),
          offset: z
            .number()
            .min(0)
            .default(0)
            .optional()
            .describe("Number of results to skip for pagination"),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await runJXA<{
          items: Reminder[];
          total_available: number;
          offset: number;
          limit: number;
          has_more: boolean;
        }>(
          getRemindersScript({
            listName: params.listName,
            completed: params.completed,
            search: params.search,
            limit: params.limit ?? 50,
            offset: params.offset ?? 0,
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

  // ── Get Single Reminder ──────────────────────────────────────────
  server.registerTool(
    "reminders_get_reminder",
    {
      title: "Get reminder by ID",
      description:
        "Returns full details of a single reminder by its unique ID.\n\n" +
        "Args:\n" +
        "  - id: The unique ID of the reminder\n\n" +
        "Returns: Reminder object with all fields",
      inputSchema: z
        .object({
          id: z.string().describe("The unique ID of the reminder"),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await runJXA<Reminder>(
          getReminderByIdScript(params.id)
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

  // ── Get Lists ────────────────────────────────────────────────────
  server.registerTool(
    "reminders_get_lists",
    {
      title: "List reminder lists",
      description:
        "List all reminder lists in Apple Reminders.\n\n" +
        "Returns: Array of { id, name, color }",
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const result = await runJXA<ReminderList[]>(getListsScript());
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
