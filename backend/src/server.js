const express = require('express');
const cors = require('cors');
const companiesRouter = require('./routes/companies');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple request log — useful when checking CloudWatch logs from ECS/CodeBuild labs
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check — used by the ALB target group and ECS health checks
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/companies', companiesRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TechNexus API listening on port ${PORT}`);
});
