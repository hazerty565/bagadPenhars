import { building } from '$app/environment';

// après
if (!building && !url) {
  throw new Error('DATABASE_URL est requise pour la connexion à Neon via Hyperdrive.');
}
