import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config';
import { createAIProvider } from './ai-providers';
import { createGenerateRouter } from './routes/generate';

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for API
    }));

    // CORS configuration
    app.use(cors({
      origin: config.nodeEnv === 'development' ? 'http://localhost:5173' : false,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Initialize AI provider
    const aiProvider = createAIProvider(config.openaiApiKey, config.anthropicApiKey);

    // API routes
    app.use('/api', createGenerateRouter(aiProvider));

    // 404 handler
    app.use((_req, res) => {
      res.status(404).json({
        error: 'Not found',
        code: 'NOT_FOUND',
      });
    });

    // Error handler
    app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Folder Insights AI server running on port ${config.port}`);
      console.log(`📡 Health check: http://localhost:${config.port}/health`);
      console.log(`🔗 API endpoint: http://localhost:${config.port}/api/generate`);
      
      if (config.nodeEnv === 'development') {
        console.log(`🌐 CORS enabled for: http://localhost:5173`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();