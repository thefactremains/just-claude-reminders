# just-claude-reminders

MCP server for Apple Reminders on macOS. Read, create, update, complete, and delete reminders directly from Claude.

Built with the same architecture as [just-claude-things](https://github.com/Phantazein-apps/just-claude-things).

## Requirements

- macOS (uses JavaScript for Automation / JXA)
- Node.js 18+
- Automation permission for the Reminders app (granted on first use)

## Installation

### Claude Code

```bash
claude mcp add reminders -- npx -y reminders-mcp
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reminders": {
      "command": "npx",
      "args": ["-y", "reminders-mcp"]
    }
  }
}
```

### Local Development

```bash
git clone https://github.com/Phantazein-apps/just-claude-reminders.git
cd just-claude-reminders
npm install
npm run build
```

Then add to Claude Code:

```bash
claude mcp add reminders -- node /path/to/just-claude-reminders/dist/index.js
```

## Tools

### Read

| Tool | Description |
|------|-------------|
| `reminders_get_reminders` | List reminders with filters (list, completed, search) and pagination |
| `reminders_get_reminder` | Get a single reminder by ID |
| `reminders_get_lists` | List all reminder lists |

### Write

| Tool | Description |
|------|-------------|
| `reminders_create_reminder` | Create a new reminder with title, notes, due date, alert, priority, flag |
| `reminders_update_reminder` | Update an existing reminder (partial updates supported) |
| `reminders_complete_reminder` | Mark a reminder as complete |
| `reminders_delete_reminder` | Permanently delete a reminder |

## Examples

**Create a reminder with a due date and alert:**
> "Remind me to renew my passport on June 1st at 9am"

**List incomplete reminders in a specific list:**
> "What's on my Groceries list?"

**Complete a reminder:**
> "Mark the dentist appointment reminder as done"

## Permissions

On first use, macOS will ask you to grant automation access. Go to:

**System Settings → Privacy & Security → Automation** and enable access for your terminal/Claude app to control Reminders.

## License

MIT
