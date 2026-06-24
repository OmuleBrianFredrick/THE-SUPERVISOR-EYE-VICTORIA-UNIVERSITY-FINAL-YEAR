import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import apiRoutes from './server/routes/index.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Supervisor Eye API Online' });
  });

  app.use('/api/v1', apiRoutes);

  // Robust production detection: check if build artifacts exist
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(process.cwd(), 'dist/index.html'));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Supervisor Eye Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});