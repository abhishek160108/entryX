import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './app.js';
import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

const PORT = process.env.PORT || 5000;

app.use(express.static(distPath));

// Fallback to index.html for SPA routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🎬 EntryX Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`🛡️  "One Ticket. One Entry."`);
  console.log(`🏢 Theaters: ${db.theaters.length} | Active Tickets: ${db.tickets.length}`);
  console.log(`=======================================================`);
});
