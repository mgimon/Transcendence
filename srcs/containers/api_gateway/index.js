import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fs from 'fs';

const app = Fastify({ 
  logger: true, 
  trustProxy: true,
  https: {
    key: fs.readFileSync('/certs/api_gateway.key'),
    cert: fs.readFileSync('/certs/api_gateway.crt')
  }
});
// la opcion 'logger: true' muestra logs de incoming requests, redirecciones y codigos de respuesta 
// la opcion 'trustproxy: true' confia que el proxy(nginx o vite) viene con https

app.register(rateLimit, {
  max: 300,               // máximo 100 requests
  timeWindow: "1 minute", // por minuto
});

// 🔐 HTTPS enforcement
// app.addHook('onRequest', async (req, reply) => {
//   // If original request came via HTTP
//   if (req.headers['x-forwarded-proto'] !== 'https') {
//     return reply.redirect(`https://${req.hostname}${req.url}`);
//   }
// });

// printf para ver la request en los logs de la api-gateway
app.addHook('onRequest', async (req) => {
  console.log(`[GATEWAY] ${req.method} ${req.url}`);
});

app.register(proxy, {
  upstream: "https://user-service:3000",
  prefix: "/api/users",
  rewritePrefix: "/"
});

app.register(proxy, {
  upstream: "https://auth-service:3000",
  prefix: "/api/auth/",
  rewritePrefix: "/",
});

app.get("/api/health", async () => {
  return { ok: "service api_gateway is running" };});

app.listen({ port: 3000, host: "0.0.0.0" });