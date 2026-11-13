import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';
import { BookkeepingModule } from './modules/bookkeeping/bookkeeping.module.ts';
import { InventoryModule } from './modules/inventory/inventory.module.ts';
import { ProductsModule } from './modules/products/products.module.ts';
import { SalesModule } from './modules/sales/sales.module.ts';
import { SystemModule } from './modules/system/system.module.ts';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProductsModule,
    SalesModule,
    InventoryModule,
    BookkeepingModule,
    SystemModule,
  ],
})
export class AppModule {}
