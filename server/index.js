import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { dbService } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 提供前端静态文件
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// System Prompts
app.get('/api/prompts/system', (req, res) => {
  try {
    const prompts = dbService.getSystemPrompts();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prompts/system', (req, res) => {
  try {
    const prompts = dbService.saveSystemPrompt(req.body);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/prompts/system/:id', (req, res) => {
  try {
    const prompts = dbService.deleteSystemPrompt(req.params.id);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/prompts/system/:id/title', (req, res) => {
  try {
    const prompts = dbService.updateSystemPromptTitle(req.params.id, req.body.title);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/prompts/system/:id/favorite', (req, res) => {
  try {
    const prompts = dbService.toggleSystemPromptFavorite(req.params.id);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Prompts
app.get('/api/prompts/user', (req, res) => {
  try {
    const prompts = dbService.getUserPrompts();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prompts/user', (req, res) => {
  try {
    const prompts = dbService.saveUserPrompt(req.body);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/prompts/user/:id', (req, res) => {
  try {
    const prompts = dbService.deleteUserPrompt(req.params.id);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/prompts/user/:id/title', (req, res) => {
  try {
    const prompts = dbService.updateUserPromptTitle(req.params.id, req.body.title);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/prompts/user/:id/favorite', (req, res) => {
  try {
    const prompts = dbService.toggleUserPromptFavorite(req.params.id);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test Runs (History)
app.get('/api/history', (req, res) => {
  try {
    const runs = dbService.getTestRuns();
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/history', (req, res) => {
  try {
    dbService.saveTestRun(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/history/:id', (req, res) => {
  try {
    const runs = dbService.deleteTestRun(req.params.id);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/history/:id/favorite', (req, res) => {
  try {
    const runs = dbService.toggleTestRunFavorite(req.params.id);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings
app.get('/api/settings/api-key', (req, res) => {
  try {
    const apiKey = dbService.getApiKey();
    res.json({ apiKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/api-key', (req, res) => {
  try {
    dbService.saveApiKey(req.body.apiKey);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 所有非 API 路由返回前端应用
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Frontend: http://localhost:${PORT}`);
});

