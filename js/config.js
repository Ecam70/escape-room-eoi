/* Clave de acceso al juego.
   - Cámbiala por la que quieras dar a los jugadores (no distingue mayúsculas, minúsculas ni espacios).
   - Déjala vacía ('') para que el juego no pida clave. */
window.ER_ACCESS_KEY = 'DEMODAY2026';

/* Clasificación compartida entre todos los jugadores (Supabase).
   - Pega aquí la «Project URL» y la clave pública («publishable» o «anon») de tu proyecto de Supabase.
   - Si se dejan vacías, la clasificación solo muestra las partidas jugadas en cada navegador.
   - La tabla se crea una sola vez con el SQL de supabase.sql. */
window.ER_LEADERBOARD = { url: 'https://kpinauvqrmhhkiveehdi.supabase.co', key: 'sb_publishable_QXIoW1bcWQwCBZK0ZpGb1Q_-9ldLN0n' };
