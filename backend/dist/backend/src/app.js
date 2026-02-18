"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const openai_routes_1 = __importDefault(require("./routes/openai.routes"));
const app = (0, express_1.default)();
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ── API Routes ─────────────────────────────────────────────────────────
app.use('/api', dashboard_routes_1.default);
app.use('/api/openai', openai_routes_1.default);
// ── Health-check ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'panel-dashboard-backend' });
});
exports.default = app;
