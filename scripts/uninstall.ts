#!/usr/bin/env bun
/**
 * Uninstallation script for claude-session-logger
 *
 * This script removes the hooks from your Claude Code settings.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CLAUDE_SETTINGS_FILE = join(homedir(), ".claude", "settings.json");

const HOOK_EVENTS = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "SubagentStop",
  "Notification",
  "PermissionRequest",
  "PreCompact",
];

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
  writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function uninstall(): void {
  console.log("Uninstalling claude-session-logger hooks...\n");

  if (!existsSync(CLAUDE_SETTINGS_FILE)) {
    console.log("No Claude settings file found. Nothing to uninstall.");
    return;
  }

  const settings = loadSettings();
  const hooks = (settings.hooks as Record<string, unknown[]>) || {};

  let removedCount = 0;

  for (const eventName of HOOK_EVENTS) {
    if (!hooks[eventName]) {
      continue;
    }

    const eventHooks = hooks[eventName] as any[];
    const filtered = eventHooks.filter((h) => {
      const isOurs = h.hooks?.some((hook: any) =>
        hook.command?.includes("claude-remember") ||
        hook.command?.includes("session-logger")
      );
      return !isOurs;
    });

    if (filtered.length !== eventHooks.length) {
      console.log(`  ✓ ${eventName}: Removed`);
      removedCount++;

      if (filtered.length === 0) {
        delete hooks[eventName];
      } else {
        hooks[eventName] = filtered;
      }
    }
  }

  if (removedCount === 0) {
    console.log("No claude-session-logger hooks found.");
    return;
  }

  // Clean up empty hooks object
  if (Object.keys(hooks).length === 0) {
    delete settings.hooks;
  } else {
    settings.hooks = hooks;
  }

  saveSettings(settings);

  console.log(`\n✅ Uninstalled ${removedCount} hooks.`);
  console.log("\nNote: Your log files at ~/.claude-logs/ have been preserved.");
  console.log("Delete them manually if you no longer need them.");
}

uninstall();
