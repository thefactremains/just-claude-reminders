import { execFile } from "node:child_process";
/**
 * Escape a string for safe interpolation inside JXA template literals.
 */
export function escapeJS(str) {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}
/**
 * Execute a JXA (JavaScript for Automation) script via osascript.
 */
export async function runJXA(script) {
    return new Promise((resolve, reject) => {
        execFile("osascript", ["-l", "JavaScript", "-e", script], { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                const msg = stderr || error.message;
                // Translate common AppleScript errors
                if (msg.includes("-1728")) {
                    reject(new Error("Item not found. It may have been deleted."));
                }
                else if (msg.includes("-600")) {
                    reject(new Error("Reminders is not running. Please open the Reminders app."));
                }
                else if (msg.includes("-1743")) {
                    reject(new Error("Permission denied. Grant automation access in System Settings → Privacy & Security → Automation."));
                }
                else {
                    reject(new Error(`JXA error: ${msg}`));
                }
                return;
            }
            const trimmed = stdout.trim();
            if (!trimmed) {
                resolve(undefined);
                return;
            }
            try {
                resolve(JSON.parse(trimmed));
            }
            catch {
                resolve(trimmed);
            }
        });
    });
}
