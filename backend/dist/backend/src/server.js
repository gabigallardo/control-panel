"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const supabase_1 = require("./config/supabase");
async function bootstrap() {
    // ── Test de conexión a Supabase ────────────────────────────────────
    if (env_1.env.SUPABASE_URL && env_1.env.SUPABASE_SERVICE_KEY) {
        await (0, supabase_1.testSupabaseConnection)();
    }
    else {
        console.warn('⚠️  SUPABASE_URL o SERVICE_KEY no configuradas — usando datos Mock');
    }
    // ── Iniciar servidor ──────────────────────────────────────────────
    const server = app_1.default.listen(env_1.env.PORT, () => {
        console.log(`🚀 Backend running at http://localhost:${env_1.env.PORT}`);
    });
    // ── Graceful shutdown ─────────────────────────────────────────────
    const shutdown = async () => {
        console.log('\n🛑 Cerrando servidor...');
        server.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
bootstrap();
