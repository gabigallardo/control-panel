import express from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.routes';
import openaiRoutes from './routes/openai.routes';

const app = express();

app.use(cors());
app.use(express.json());

// ── API Routes ─────────────────────────────────────────────────────────
app.use('/api', dashboardRoutes);
app.use('/api/openai', openaiRoutes);

// ── Health-check ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'panel-dashboard-backend' });
});

export default app;
