import express from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.routes';
import openaiRoutes from './routes/openai.routes';

const app = express();

app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());

// app.use((req, res) => {
//     res.send('Express OK');
// });

// ── API Routes ─────────────────────────────────────────────────────────
app.use('/api', dashboardRoutes);
app.use('/api/openai', openaiRoutes);

// ── Health-check ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'panel-dashboard-backend' });
});

export default app;
