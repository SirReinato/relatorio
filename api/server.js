import { createApi } from './app.js';

const port = Number(process.env.API_PORT || 3000);
const host = process.env.API_HOST || '127.0.0.1';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('API_PORT deve ser um inteiro entre 1 e 65535.');
}

const app = await createApi();

try {
  await app.listen({ port, host });
} catch (error) {
  await app.close();
  throw error;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
}
