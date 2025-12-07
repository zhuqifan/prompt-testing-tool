import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径（在容器中）
const dbPath = process.env.DB_PATH || join(__dirname, 'data.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS system_prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    is_favorite INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    is_favorite INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS test_runs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    config TEXT NOT NULL,
    results TEXT NOT NULL,
    is_favorite INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// 准备语句
const stmts = {
  // System Prompts
  getSystemPrompts: db.prepare('SELECT * FROM system_prompts ORDER BY created_at DESC'),
  getSystemPrompt: db.prepare('SELECT * FROM system_prompts WHERE id = ?'),
  insertSystemPrompt: db.prepare('INSERT INTO system_prompts (id, title, content, created_at, is_favorite) VALUES (?, ?, ?, ?, ?)'),
  updateSystemPrompt: db.prepare('UPDATE system_prompts SET title = ?, content = ?, is_favorite = ? WHERE id = ?'),
  deleteSystemPrompt: db.prepare('DELETE FROM system_prompts WHERE id = ?'),

  // User Prompts
  getUserPrompts: db.prepare('SELECT * FROM user_prompts ORDER BY created_at DESC'),
  getUserPrompt: db.prepare('SELECT * FROM user_prompts WHERE id = ?'),
  insertUserPrompt: db.prepare('INSERT INTO user_prompts (id, title, content, created_at, is_favorite) VALUES (?, ?, ?, ?, ?)'),
  updateUserPrompt: db.prepare('UPDATE user_prompts SET title = ?, content = ?, is_favorite = ? WHERE id = ?'),
  deleteUserPrompt: db.prepare('DELETE FROM user_prompts WHERE id = ?'),

  // Test Runs
  getTestRuns: db.prepare('SELECT * FROM test_runs ORDER BY timestamp DESC LIMIT 50'),
  getTestRun: db.prepare('SELECT * FROM test_runs WHERE id = ?'),
  insertTestRun: db.prepare('INSERT INTO test_runs (id, timestamp, system_prompt, user_prompt, config, results, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  updateTestRun: db.prepare('UPDATE test_runs SET is_favorite = ? WHERE id = ?'),
  deleteTestRun: db.prepare('DELETE FROM test_runs WHERE id = ?'),

  // Settings
  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  setSetting: db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'),
};

// 事务
const transactions = {
  upsertSystemPrompt: db.transaction((prompt) => {
    const existing = stmts.getSystemPrompt.get(prompt.id);
    if (existing) {
      stmts.updateSystemPrompt.run(prompt.title, prompt.content, prompt.isFavorite ? 1 : 0, prompt.id);
    } else {
      stmts.insertSystemPrompt.run(prompt.id, prompt.title, prompt.content, prompt.createdAt, prompt.isFavorite ? 1 : 0);
    }
  }),

  upsertUserPrompt: db.transaction((prompt) => {
    const existing = stmts.getUserPrompt.get(prompt.id);
    if (existing) {
      stmts.updateUserPrompt.run(prompt.title, prompt.content, prompt.isFavorite ? 1 : 0, prompt.id);
    } else {
      stmts.insertUserPrompt.run(prompt.id, prompt.title, prompt.content, prompt.createdAt, prompt.isFavorite ? 1 : 0);
    }
  }),
};

// 转换函数
const toSystemPrompt = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  type: 'system',
  createdAt: row.created_at,
  isFavorite: row.is_favorite === 1
});

const toUserPrompt = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  type: 'user',
  createdAt: row.created_at,
  isFavorite: row.is_favorite === 1
});

const toTestRun = (row) => ({
  id: row.id,
  timestamp: row.timestamp,
  systemPrompt: row.system_prompt,
  userPrompt: row.user_prompt,
  config: JSON.parse(row.config),
  results: JSON.parse(row.results),
  isFavorite: row.is_favorite === 1
});

export const dbService = {
  // System Prompts
  getSystemPrompts: () => {
    return stmts.getSystemPrompts.all().map(toSystemPrompt);
  },

  saveSystemPrompt: (prompt) => {
    transactions.upsertSystemPrompt(prompt);
    return dbService.getSystemPrompts();
  },

  deleteSystemPrompt: (id) => {
    stmts.deleteSystemPrompt.run(id);
    return dbService.getSystemPrompts();
  },

  updateSystemPromptTitle: (id, title) => {
    const existing = stmts.getSystemPrompt.get(id);
    if (existing) {
      stmts.updateSystemPrompt.run(title, existing.content, existing.is_favorite, id);
    }
    return dbService.getSystemPrompts();
  },

  toggleSystemPromptFavorite: (id) => {
    const existing = stmts.getSystemPrompt.get(id);
    if (existing) {
      stmts.updateSystemPrompt.run(existing.title, existing.content, existing.is_favorite === 1 ? 0 : 1, id);
    }
    return dbService.getSystemPrompts();
  },

  // User Prompts
  getUserPrompts: () => {
    return stmts.getUserPrompts.all().map(toUserPrompt);
  },

  saveUserPrompt: (prompt) => {
    transactions.upsertUserPrompt(prompt);
    return dbService.getUserPrompts();
  },

  deleteUserPrompt: (id) => {
    stmts.deleteUserPrompt.run(id);
    return dbService.getUserPrompts();
  },

  updateUserPromptTitle: (id, title) => {
    const existing = stmts.getUserPrompt.get(id);
    if (existing) {
      stmts.updateUserPrompt.run(title, existing.content, existing.is_favorite, id);
    }
    return dbService.getUserPrompts();
  },

  toggleUserPromptFavorite: (id) => {
    const existing = stmts.getUserPrompt.get(id);
    if (existing) {
      stmts.updateUserPrompt.run(existing.title, existing.content, existing.is_favorite === 1 ? 0 : 1, id);
    }
    return dbService.getUserPrompts();
  },

  // Test Runs
  getTestRuns: () => {
    return stmts.getTestRuns.all().map(toTestRun);
  },

  saveTestRun: (run) => {
    const existing = stmts.getTestRun.get(run.id);
    if (!existing) {
      stmts.insertTestRun.run(
        run.id,
        run.timestamp,
        run.systemPrompt,
        run.userPrompt,
        JSON.stringify(run.config),
        JSON.stringify(run.results),
        run.isFavorite ? 1 : 0
      );
    }
  },

  deleteTestRun: (id) => {
    stmts.deleteTestRun.run(id);
    return dbService.getTestRuns();
  },

  toggleTestRunFavorite: (id) => {
    const existing = stmts.getTestRun.get(id);
    if (existing) {
      stmts.updateTestRun.run(existing.is_favorite === 1 ? 0 : 1, id);
    }
    return dbService.getTestRuns();
  },

  // Settings
  getApiKey: () => {
    const result = stmts.getSetting.get('api_key');
    return result ? result.value : '';
  },

  saveApiKey: (key) => {
    stmts.setSetting.run('api_key', key);
  },
};

