// server.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RateLimited', details: 'Too many requests, slow down.' },
});
app.use('/api/', limiter);

// --- OpenAPI spec + Swagger UI ---
const openapiPath = path.join(__dirname, 'openapi.yaml');
const openapiDocument = YAML.load(openapiPath);

app.get('/openapi.json', (req, res) => res.json(openapiDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// --- Routes ---
app.use('/api', chatRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: process.uptime(),
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.get('/', (req, res) => {
  res.type('text').send(
    'AshleyAi server is running.\n' +
      '- Chat endpoint: POST /api/chat\n' +
      '- API docs: GET /docs\n' +
      '- OpenAPI spec: GET /openapi.json\n'
  );
});

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', details: `No route for ${req.method} ${req.originalUrl}` });
});

// --- Error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'InternalServerError', details: err.message });
});

app.listen(PORT, () => {
  console.log(`AshleyAi server listening on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});
