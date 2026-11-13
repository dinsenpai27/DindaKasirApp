import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller.ts';
import { SalesService } from './sales.service.ts';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
