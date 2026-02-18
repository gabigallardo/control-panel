import app from './app';
import { env } from './config/env';
import { testSupabaseConnection } from './config/supabase';

async function bootstrap() {
  // ── Test de conexión a Supabase ────────────────────────────────────
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    await testSupabaseConnection();
  } else {
    console.warn('⚠️  SUPABASE_URL o SERVICE_KEY no configuradas — usando datos Mock');
  }

  // ── Iniciar servidor ──────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${env.PORT}`);
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