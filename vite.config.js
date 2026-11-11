import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json; charset=utf-8',
              });
              res.end(
                JSON.stringify({
                  error: {
                    code: 'API_OFFLINE',
                    message:
                      'A API Fastify não está em execução na porta 3000. Inicie-a com npm run api:dev ou utilize npm run dev para iniciar o stack completo.',
                    retryable: true,
                  },
                }),
              );
            }
          });
        },
      },
    },
  },
});
