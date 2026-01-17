#!/usr/bin/env bun
/**
 * Installation script for claude-session-logger
 *
 * This script adds the necessary hooks to your Claude Code settings.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";

const CLAUDE_SETTINGS_DIR = join(homedir(), ".claude");
const CLAUDE_SETTINGS_FILE = join(CLAUDE_SETTINGS_DIR, "settings.json");

// Get the absolute path to the handler
const PLUGIN_DIR = resolve(join(import.meta.dir, ".."));
const HANDLER_PATH = join(PLUGIN_DIR, "src", "handler.ts");

const HOOKS_CONFIG = {
  SessionStart: [
    {
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  SessionEnd: [
    {
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  UserPromptSubmit: [
    {
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  PreToolUse: [
    {
      matcher: "*",
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  PostToolUse: [
    {
      matcher: "*",
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  Stop: [
    {
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  SubagentStop: [
    {
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  Notification: [
    {
      matcher: "*",
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  PermissionRequest: [
    {
      matcher: "*",
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 10,
        },
      ],
    },
  ],
  PreCompact: [
    {
      matcher: "*",
      hooks: [
        {
          type: "command",
          command: `bun run "${HANDLER_PATH}"`,
          timeout: 15,  // Slightly longer for transcript backup
        },
      ],
    },
  ],
};

function loadSettings(): Record<string, unknown> {
  if (!existsSync(CLAUDE_SETTINGS_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CLAUDE_SETTINGS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse existing settings:", e);
    return {};
  }
}

function saveSettings(settings: Record<string, unknown>): void {
  if (!existsSync(CLAUDE_SETTINGS_DIR)) {
    mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
  }

  writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function install(): void {
  console.log("Installing claude-session-logger hooks...\n");
  console.log(`Plugin directory: ${PLUGIN_DIR}`);
  console.log(`Handler path: ${HANDLER_PATH}\n`);

  // Verify handler exists
  if (!existsSync(HANDLER_PATH)) {
    console.error(`Error: Handler not found at ${HANDLER_PATH}`);
    process.exit(1);
  }

  // Load existing settings
  const settings = loadSettings();

  // Merge hooks
  const existingHooks = (settings.hooks as Record<string, unknown[]>) || {};
  const mergedHooks: Record<string, unknown[]> = { ...existingHooks };

  for (const [eventName, hookConfig] of Object.entries(HOOKS_CONFIG)) {
    if (mergedHooks[eventName]) {
      // Check if our hook already exists
      const existing = mergedHooks[eventName] as any[];
      const alreadyInstalled = existing.some((h) =>
        h.hooks?.some((hook: any) => hook.command?.includes("claude-remember"))
      );

      if (alreadyInstalled) {
        console.log(`  ⚠ ${eventName}: Already installed, skipping`);
        continue;
      }

      // Append our hooks
      mergedHooks[eventName] = [...existing, ...hookConfig];
      console.log(`  ✓ ${eventName}: Added to existing hooks`);
    } else {
      mergedHooks[eventName] = hookConfig;
      console.log(`  ✓ ${eventName}: Installed`);
    }
  }

  settings.hooks = mergedHooks;

  // Save updated settings
  saveSettings(settings);

  console.log("\n✅ Installation complete!");
  console.log("\nLogs will be saved to:");
  console.log(`  - Markdown: ~/.claude-logs/sessions/`);
  console.log(`  - SQLite:   ~/.claude-logs/sessions.db`);
  console.log("\nTo customize, create ~/.claude-logs/config.json");
}

install();
