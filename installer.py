#!/usr/bin/env python3
"""
Just Claude Reminders Installer - cross-platform installer for Apple Reminders MCP server.
Run with: uv run --python 3.12 installer.py
"""

import json
import os
import platform
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# ANSI colors
# ---------------------------------------------------------------------------
GREEN = "\033[0;32m"
YELLOW = "\033[0;33m"
RED = "\033[0;31m"
BOLD = "\033[1m"
DIM = "\033[2m"
NC = "\033[0m"

if platform.system() == "Windows":
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-11)
        mode = ctypes.c_ulong()
        if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            kernel32.SetConsoleMode(handle, mode.value | 0x0004)
    except Exception:
        pass

REPO_URL = "https://github.com/Phantazein-apps/just-claude-reminders.git"
PROJECT_SLUG = "just-claude-reminders"
PROJECT_NAME = "Just Claude Reminders"
MCP_SERVER_NAME = "reminders"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def c(color: str, text: str) -> str:
    return f"{color}{text}{NC}"


def info(msg: str) -> None:
    print(f"{GREEN}  {msg}{NC}")


def warn(msg: str) -> None:
    print(f"{YELLOW}  Warning: {msg}{NC}")


def error(msg: str) -> None:
    print(f"{RED}  Error: {msg}{NC}")


def die(msg: str) -> None:
    error(msg)
    sys.exit(1)


def ask(prompt: str, default: str = "") -> str:
    display_default = f" [{default}]" if default else ""
    try:
        value = input(f"  {prompt}{display_default}: ").strip()
        return value if value else default
    except (EOFError, KeyboardInterrupt):
        print()
        return default


def ask_yn(prompt: str, default: bool = True) -> bool:
    hint = "Y/n" if default else "y/N"
    try:
        value = input(f"  {prompt} ({hint}): ").strip().lower()
        if not value:
            return default
        return value in ("y", "yes")
    except (EOFError, KeyboardInterrupt):
        print()
        return default


def run(cmd: list, cwd: Path = None, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=cwd, check=check)

# ---------------------------------------------------------------------------
# Step 1: Banner
# ---------------------------------------------------------------------------

def print_banner() -> None:
    print()
    print(c(BOLD, "=" * 60))
    print(c(BOLD, " Just Claude Reminders Installer"))
    print(c(BOLD, " Apple Reminders MCP server for Claude on macOS"))
    print(c(BOLD, "=" * 60))
    print()

# ---------------------------------------------------------------------------
# Step 2: Check prerequisites
# ---------------------------------------------------------------------------

def check_prerequisites() -> None:
    print(c(BOLD, "Checking prerequisites..."))

    # macOS check
    if platform.system() != "Darwin":
        die("This MCP server requires macOS (uses JXA to talk to Apple Reminders).")
    info("macOS detected")

    # Node.js check
    try:
        result = subprocess.run(
            ["node", "--version"],
            check=True,
            capture_output=True,
            text=True,
        )
        version = result.stdout.strip().lstrip("v")
        major = int(version.split(".")[0])
        if major < 18:
            die(f"Node.js 18+ required, found v{version}. Update from https://nodejs.org/")
        info(f"Node.js {result.stdout.strip()} found")
    except (subprocess.CalledProcessError, FileNotFoundError):
        die("Node.js is not installed. Install from https://nodejs.org/ and re-run.")

    # npm check
    try:
        subprocess.run(["npm", "--version"], check=True, capture_output=True)
        info("npm found")
    except (subprocess.CalledProcessError, FileNotFoundError):
        die("npm is not installed. Install Node.js from https://nodejs.org/ and re-run.")

    # Reminders app check (always present on macOS, but verify)
    reminders_app = Path("/System/Applications/Reminders.app")
    if reminders_app.exists():
        info("Apple Reminders found")
    else:
        warn("Reminders app not found at expected path. It should be built into macOS.")

    print()

# ---------------------------------------------------------------------------
# Step 3: Install directory
# ---------------------------------------------------------------------------

def get_install_dir() -> tuple:
    print(c(BOLD, "Install location"))
    default = str(Path.home() / PROJECT_SLUG)
    raw = ask("Install directory", default)
    install_dir = Path(raw).expanduser().resolve()

    is_rerun = (install_dir / ".git").exists()
    if is_rerun:
        warn(f"Existing installation detected at {install_dir} - will update.")
    else:
        info(f"Will install to {install_dir}")

    print()
    return install_dir, is_rerun

# ---------------------------------------------------------------------------
# Step 4: Clone or pull
# ---------------------------------------------------------------------------

def clone_or_pull(install_dir: Path, is_rerun: bool) -> None:
    print(c(BOLD, "Setting up repository..."))

    if is_rerun:
        info(f"Pulling latest changes in {install_dir}")
        run(["git", "pull"], cwd=install_dir)
    else:
        install_dir.parent.mkdir(parents=True, exist_ok=True)
        info(f"Cloning {REPO_URL}")
        run(["git", "clone", REPO_URL, str(install_dir)])

    print()

# ---------------------------------------------------------------------------
# Step 5: Install deps and build
# ---------------------------------------------------------------------------

def setup_node(install_dir: Path) -> None:
    print(c(BOLD, "Setting up Node.js environment..."))

    info("Installing dependencies...")
    run(["npm", "install", "--silent"], cwd=install_dir)

    info("Building TypeScript...")
    run(["npm", "run", "build"], cwd=install_dir)

    info("Environment ready.")
    print()

# ---------------------------------------------------------------------------
# Step 6: AI client configuration
# ---------------------------------------------------------------------------

def get_claude_desktop_config_path() -> Path | None:
    system = platform.system()
    if system == "Darwin":
        return Path.home() / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
    elif system == "Linux":
        return Path.home() / ".config" / "Claude" / "claude_desktop_config.json"
    elif system == "Windows":
        appdata = os.environ.get("APPDATA", "")
        if appdata:
            return Path(appdata) / "Claude" / "claude_desktop_config.json"
    return None


def build_mcp_entry(install_dir: Path) -> dict:
    return {
        "command": "node",
        "args": [str(install_dir / "dist" / "index.js")],
    }


def configure_json_file(config_path: Path, install_dir: Path, label: str) -> bool:
    if not config_path.parent.exists():
        if not ask_yn(f"{label} config dir not found at {config_path.parent}.\n  Configure anyway?", default=False):
            return False
        config_path.parent.mkdir(parents=True, exist_ok=True)

    config = {}
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
        except json.JSONDecodeError:
            warn(f"Could not parse {config_path} - will overwrite.")

    config.setdefault("mcpServers", {})
    config["mcpServers"][MCP_SERVER_NAME] = build_mcp_entry(install_dir)

    config_path.write_text(json.dumps(config, indent=2) + "\n")
    info(f"Configured {label}: {config_path}")
    return True


def configure_ai_clients(install_dir: Path) -> bool:
    print(c(BOLD, "Configuring AI clients..."))
    any_configured = False

    # Claude Desktop
    desktop_path = get_claude_desktop_config_path()
    if desktop_path is not None:
        if desktop_path.parent.exists():
            info("Claude Desktop detected - auto-configuring...")
            if configure_json_file(desktop_path, install_dir, "Claude Desktop"):
                any_configured = True
        else:
            print(f"  {DIM}Claude Desktop not detected ({desktop_path.parent}){NC}")
            if ask_yn("Configure Claude Desktop MCP anyway?", default=False):
                if configure_json_file(desktop_path, install_dir, "Claude Desktop"):
                    any_configured = True

    # Claude Code — settings.json
    code_settings_path = Path.home() / ".claude" / "settings.json"
    if code_settings_path.parent.exists():
        info("Claude Code detected - auto-configuring settings.json...")
        if configure_json_file(code_settings_path, install_dir, "Claude Code"):
            any_configured = True
    else:
        print(f"  {DIM}Claude Code not detected ({code_settings_path.parent}){NC}")
        if ask_yn("Configure Claude Code MCP anyway?", default=False):
            if configure_json_file(code_settings_path, install_dir, "Claude Code"):
                any_configured = True

    # Claude Code — ~/.claude.json (CLI)
    cli_config_path = Path.home() / ".claude.json"
    if configure_json_file(cli_config_path, install_dir, "Claude Code CLI"):
        any_configured = True

    print()
    return any_configured

# ---------------------------------------------------------------------------
# Step 7: Permissions guidance
# ---------------------------------------------------------------------------

def show_permissions_guidance() -> None:
    print(c(BOLD, "macOS Automation permissions"))
    print()
    print("  When Claude first uses Reminders, macOS will prompt for Automation access.")
    print("  If the prompt doesn't appear, grant it manually:")
    print()
    print(f"    {BOLD}System Settings → Privacy & Security → Automation{NC}")
    print(f"    Enable access for your terminal / Claude Desktop to control {BOLD}Reminders{NC}")
    print()

# ---------------------------------------------------------------------------
# Step 8: Done
# ---------------------------------------------------------------------------

def print_done(any_clients_configured: bool) -> None:
    print(c(BOLD, "=" * 60))
    print(c(GREEN + BOLD, " Installation complete!"))
    print(c(BOLD, "=" * 60))
    print()
    if any_clients_configured:
        print(f"  {YELLOW}Restart your AI assistant (Claude Desktop / Claude Code){NC}")
        print(f"  for the {MCP_SERVER_NAME} MCP server to take effect.")
        print()
    print(f"  The {MCP_SERVER_NAME} MCP server is ready to use.")
    print(f"  Ask Claude to manage your Apple Reminders!")
    print()

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print_banner()
    check_prerequisites()

    install_dir, is_rerun = get_install_dir()
    clone_or_pull(install_dir, is_rerun)
    setup_node(install_dir)

    any_configured = configure_ai_clients(install_dir)
    show_permissions_guidance()
    print_done(any_configured)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print(f"\n{YELLOW}  Installation cancelled.{NC}")
        sys.exit(1)
