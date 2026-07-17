import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

import apiRoutes from './server/routes/index.js';
import { startWorker } from './server/services/worker.js';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Start background processing engine
  startWorker().catch(err => console.error("Worker failed to start:", err));

  app.use(express.json());
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Supervisor Eye API Online' });
  });

  app.use('/api/v1', apiRoutes);

  // Robust production detection: check if build artifacts exist
  const isProduction = process.env.NODE_ENV === 'production';

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

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Supervisor Eye Backend running on http://0.0.0.0:${PORT}`);
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    console.log('GIS Command Center Client connected');
    
    // Periodically send simulated real-time intelligence events
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const eventTypes = ['REPORT_SUBMITTED', 'EVIDENCE_UPLOADED', 'ESCALATION_TRIGGERED', 'WORKFORCE_STATUS_CHANGE'];
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        const ugandaRegions = [
          { name: 'Kampala Central', lat: 0.3476, lng: 32.5825, dept: 'Merchandising' },
          { name: 'Jinja Factory', lat: 0.4244, lng: 33.2026, dept: 'Logistics' },
          { name: 'Mbarara Outlet', lat: -0.6072, lng: 30.6545, dept: 'Sales' },
          { name: 'Gulu Hub', lat: 2.7720, lng: 32.2881, dept: 'Field Audit' },
          { name: 'Mbale Depot', lat: 1.0785, lng: 34.1802, dept: 'Sales' }
        ];
        
        const reg = ugandaRegions[Math.floor(Math.random() * ugandaRegions.length)];
        const lat = reg.lat + (Math.random() - 0.5) * 0.05;
        const lng = reg.lng + (Math.random() - 0.5) * 0.05;

        const staffNames = [
          'Samuel Okello', 'Florence Nabakooza', 'John Mukasa', 'Aisha Kigundu', 
          'Joseph Otim', 'Grace Atwine', 'David Ssemwogerere', 'Sarah Birungi'
        ];
        const name = staffNames[Math.floor(Math.random() * staffNames.length)];
        
        let payload = {};
        
        if (randomType === 'REPORT_SUBMITTED') {
          payload = {
            type: randomType,
            title: 'Daily Merchandising Stock Count',
            employeeName: name,
            department: reg.dept,
            lat,
            lng,
            timestamp: new Date().toISOString(),
            status: Math.random() > 0.15 ? 'VERIFIED' : 'FLAGGED'
          };
        } else if (randomType === 'EVIDENCE_UPLOADED') {
          payload = {
            type: randomType,
            title: 'Shelf Share Evidence Photo',
            employeeName: name,
            department: reg.dept,
            lat,
            lng,
            timestamp: new Date().toISOString(),
            outsideGeofence: Math.random() > 0.85
          };
        } else if (randomType === 'ESCALATION_TRIGGERED') {
          payload = {
            type: randomType,
            title: 'SLA Breach: Missing Stock Audit',
            employeeName: name,
            department: reg.dept,
            lat,
            lng,
            timestamp: new Date().toISOString(),
            severity: Math.random() > 0.5 ? 'CRITICAL' : 'HIGH',
            reason: 'SLA timer expired after 24 hours of zero activity.'
          };
        } else {
          payload = {
            type: randomType,
            title: 'Workforce Ping',
            employeeName: name,
            department: reg.dept,
            lat,
            lng,
            timestamp: new Date().toISOString(),
            status: Math.random() > 0.8 ? 'IDLE' : 'ACTIVE'
          };
        }
        
        ws.send(JSON.stringify(payload));
      }
    }, 7000);
    
    ws.on('close', () => {
      clearInterval(interval);
      console.log('GIS Command Center Client disconnected');
    });
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});