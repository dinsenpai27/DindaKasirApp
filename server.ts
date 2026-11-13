import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { NextFunction, Request, Response } from 'express';
import * as path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { AppModule } from './server/app.module.ts';

async function bootstrap() {
  const expressApp = express();
  // NestJS v11 ExpressAdapter reads `app.router` (Express 5); bridge it safely to Express 4's `_router`
  const expressAdapterApp = new Proxy(expressApp, {
    get(target, prop) {
      if (prop === 'router') {
        const internal = target as unknown as { _router?: unknown; lazyrouter?: () => void };
        if (!internal._router && typeof internal.lazyrouter === 'function') {
          internal.lazyrouter();
        }
        return internal._router;
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });

  const port = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Serve frontend (Vite in dev, dist/ in production) for all non-/api routes
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    expressApp.use((req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      return vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const staticMiddleware = express.static(distPath);

    expressApp.use((req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      return staticMiddleware(req, res, (err) => {
        if (err) return next(err);
        if (!req.path.includes('.')) {
          return res.sendFile(path.join(distPath, 'index.html'));
        }
        return next();
      });
    });
  }

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressAdapterApp), {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors();
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('IR Beauty Store API')
    .setDescription(
      'Dokumentasi REST API Backend Nest.js untuk Aplikasi KasirKu (POS, Scan Barcode, Import Excel, Autentikasi RBAC, Inventori, Barang Masuk, Retur, Pembukuan, Shift Kasir, Users & Roles).',
    )
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('Autentikasi & Sesi', 'Login Email + PIN dan verifikasi hak akses Role (RBAC)')
    .addTag('Barang & Barcode', 'Manajemen katalog produk, kategori, import Excel massal, dan lookup barcode scanner')
    .addTag('Kasir & Penjualan', 'Shift buka/tutup kasir dan pemrosesan transaksi POS')
    .addTag('Barang Masuk & Retur', 'Pencatatan restock barang masuk dan retur barang')
    .addTag('Dashboard, Pengeluaran & Laporan', 'Overview finansial, analitik penjualan, pengeluaran, dan laporan laba rugi')
    .addTag('Sistem, Users, Roles & Settings', 'Manajemen pengguna, RBAC roles, pengaturan toko, dan skema PostgreSQL')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'IR Beauty Store — Swagger API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  await app.init();

  expressApp.listen(port, '0.0.0.0', () => {
    console.log(`KasirKu NestJS + Vite server listening on http://0.0.0.0:${port}`);
    console.log(`Swagger API Docs available at http://0.0.0.0:${port}/api/docs`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap KasirKu server:', err);
  process.exit(1);
});
