#!/usr/bin/env node

/**
 * Extract session transcript from Claude Code, Pi, or Codex session files.
 *
 * Usage:
 *   ./extract-session.js [session-path]
 *   ./extract-session.js --agent claude|pi|codex [--cwd /path/to/dir]
 *
 * If no arguments, auto-detects based on current working directory.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Parse arguments
const args = process.argv.slice(2);
let sessionPath = null;
let agent = null;
let cwd = process.cwd();

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--agent' && args[i + 1]) {
    agent = args[++i];
    continue;
  }
  if (args[i] === '--cwd' && args[i + 1]) {
    cwd = args[++i];
    continue;
  }
  if (!args[i].startsWith('-')) {
    sessionPath = args[i];
  }
}

/**
 * Encode CWD for session path lookup
 */
function encodeCwd(cwdPath, style) {
  if (style === 'pi') {
    // Pi uses: --<cwd-without-leading-slash-with-slashes-as-dashes>--
    // e.g., /Users/mitsuhiko/Development/myproject -> --Users-mitsuhiko-Development-myproject--
    return `--${cwdPath.replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}--`;
  }
  // Claude Code: just replace / with -
  return cwdPath.replace(/\//g, '-');
}

/**
 * Find the most recent session file in a directory
 */
function findMostRecentSession(dir) {
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtime
    }))
    .toSorted((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].path : null;
}

/**
 * Find Codex session matching CWD
 */
function findCodexSession(targetCwd) {
  const baseDir = path.join(os.homedir(), '.codex', 'sessions');
  if (!fs.existsSync(baseDir)) return null;

  // Find all session files, sorted by mtime
  const allSessions = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
        continue;
      }
      if (entry.name.endsWith('.jsonl')) {
        allSessions.push({
          path: fullPath,
          mtime: fs.statSync(fullPath).mtime
        });
      }
    }
  }

  walkDir(baseDir);
  allSessions.sort((a, b) => b.mtime - a.mtime);

  // Find most recent matching CWD
  for (const session of allSessions.slice(0, 50)) { // Check last 50
    try {
      const firstLine = fs.readFileSync(session.path, 'utf8').split('\n')[0];
      const data = JSON.parse(firstLine);
      if (data.payload?.cwd === targetCwd) {
        return session.path;
      }
    } catch (e) {
      // Skip invalid files
    }
  }

  return null;
}

/**
 * Auto-detect session based on CWD
 */
function autoDetectSession(cwdPath) {
  // Try Claude Code first
  const claudePath = path.join(os.homedir(), '.claude', 'projects', encodeCwd(cwdPath, 'claude'));
  const claudeSession = findMostRecentSession(claudePath);
  if (claudeSession) return { agent: 'claude', path: claudeSession };

  // Try Pi
  const piPath = path.join(os.homedir(), '.pi', 'agent', 'sessions', encodeCwd(cwdPath, 'pi'));
  const piSession = findMostRecentSession(piPath);
  if (piSession) return { agent: 'pi', path: piSession };

  // Try Codex
  const codexSession = findCodexSession(cwdPath);
  if (codexSession) return { agent: 'codex', path: codexSession };

  return null;
}

/**
 * Parse Claude Code session format
 */
function parseClaudeSession(content) {
  const messages = [];
  const lines = content.trim().split('\n');

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.message?.role && entry.message?.content) {
        const msg = entry.message;
        messages.push({
          role: msg.role,
          content: extractContent(msg.content),
          timestamp: entry.timestamp
        });
      }
    } catch (e) {
      // Skip invalid lines
    }
  }

  return messages;
}

/**
 * Parse Pi session format
 */
function parsePiSession(content) {
  const messages = [];
  const lines = content.trim().split('\n');

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'message' && entry.message?.role) {
        messages.push({
          role: entry.message.role,
          content: extractContent(entry.message.content),
          timestamp: entry.timestamp
        });
      }
    } catch (e) {
      // Skip invalid lines
    }
  }

  return messages;
}

/**
 * Parse Codex session format
 */
function parseCodexSession(content) {
  const messages = [];
  const lines = content.trim().split('\n');

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'response_item' && entry.payload?.role) {
        const payload = entry.payload;
        messages.push({
          role: payload.role,
          content: extractContent(payload.content),
          timestamp: entry.timestamp
        });
      }
    } catch (e) {
      // Skip invalid lines
    }
  }

  return messages;
}

/**
 * Extract text content from a single content item
 */
function extractContentItem(item) {
  if (typeof item === 'string') return item;
  if (item.type === 'text') return item.text;
  if (item.type === 'input_text') return item.text;
  if (item.type === 'tool_use') return `[Tool: ${item.name}]\n${JSON.stringify(item.input, null, 2)}`;
  if (item.type === 'tool_result') {
    const result = typeof item.content === 'string'
      ? item.content
      : JSON.stringify(item.content);
    // Truncate long tool results
    const truncated = result.length > 500
      ? result.slice(0, 500) + '\n[... truncated ...]'
      : result;
    return `[Tool Result]\n${truncated}`;
  }
  return `[${item.type}]`;
}

/**
 * Extract text content from various content formats
 */
function extractContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return JSON.stringify(content);

  return content.map(extractContentItem).join('\n');
}

/**
 * Format messages as readable transcript
 */
function formatTranscript(messages, maxMessages = 100) {
  const recent = messages.slice(-maxMessages);
  const lines = [];

  for (const msg of recent) {
    const role = msg.role.toUpperCase();
    lines.push(`\n### ${role}:\n`);
    lines.push(msg.content);
  }

  if (messages.length > maxMessages) {
    lines.unshift(`\n[... ${messages.length - maxMessages} earlier messages omitted ...]\n`);
  }

  return lines.join('\n');
}

/**
 * Detect agent from session path
 */
function detectAgentFromPath(sessionPath) {
  if (sessionPath.includes('.claude')) return 'claude';
  if (sessionPath.includes('.pi')) return 'pi';
  if (sessionPath.includes('.codex')) return 'codex';
  return 'claude'; // Default to Claude format
}

/**
 * Find session for explicit path
 */
function resolveExplicitPath(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    console.error(`Session file not found: ${sessionPath}`);
    process.exit(1);
  }
  return { agent: detectAgentFromPath(sessionPath), path: sessionPath };
}

/**
 * Find Claude session
 */
function findClaudeSession(cwdPath) {
  const dir = path.join(os.homedir(), '.claude', 'projects', encodeCwd(cwdPath, 'claude'));
  const session = findMostRecentSession(dir);
  if (!session) {
    console.error(`No Claude Code session found for: ${cwdPath}`);
    process.exit(1);
  }
  return { agent: 'claude', path: session };
}

/**
 * Find Pi session
 */
function findPiSession(cwdPath) {
  const dir = path.join(os.homedir(), '.pi', 'agent', 'sessions', encodeCwd(cwdPath, 'pi'));
  const session = findMostRecentSession(dir);
  if (!session) {
    console.error(`No Pi session found for: ${cwdPath}`);
    process.exit(1);
  }
  return { agent: 'pi', path: session };
}

/**
 * Find Codex session wrapper
 */
function findCodexSessionWrapper(cwdPath) {
  const session = findCodexSession(cwdPath);
  if (!session) {
    console.error(`No Codex session found for: ${cwdPath}`);
    process.exit(1);
  }
  return { agent: 'codex', path: session };
}

/**
 * Resolve session based on agent type
 */
function resolveAgentSession(agentType, cwdPath) {
  const agentResolvers = {
    claude: () => findClaudeSession(cwdPath),
    pi: () => findPiSession(cwdPath),
    codex: () => findCodexSessionWrapper(cwdPath)
  };

  const resolver = agentResolvers[agentType];
  if (!resolver) {
    console.error(`Unknown agent: ${agentType}`);
    process.exit(1);
  }
  return resolver();
}

/**
 * Parse session content based on agent type
 */
function parseSession(content, agentType) {
  const parsers = {
    claude: parseClaudeSession,
    pi: parsePiSession,
    codex: parseCodexSession
  };
  return parsers[agentType](content);
}

// Main
async function main() {
  // Resolve session path
  let result;

  if (sessionPath) {
    result = resolveExplicitPath(sessionPath);
  }

  if (!result && agent) {
    result = resolveAgentSession(agent, cwd);
  }

  if (!result) {
    result = autoDetectSession(cwd);
  }

  if (!result) {
    console.error(`No session found for: ${cwd}`);
    console.error('Try specifying --agent claude|pi|codex or provide a session path directly.');
    process.exit(1);
  }

  // Read and parse session
  const content = fs.readFileSync(result.path, 'utf8');
  const messages = parseSession(content, result.agent);

  // Output metadata and transcript
  console.log(`# Session Transcript`);
  console.log(`Agent: ${result.agent}`);
  console.log(`File: ${result.path}`);
  console.log(`Messages: ${messages.length}`);
  console.log('');
  console.log(formatTranscript(messages));
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
