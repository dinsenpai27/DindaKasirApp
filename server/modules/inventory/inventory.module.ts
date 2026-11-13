import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.ts';
import { InventoryService } from './inventory.service.ts';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
