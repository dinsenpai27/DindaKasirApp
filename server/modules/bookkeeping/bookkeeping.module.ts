import { Module } from '@nestjs/common';
import { BookkeepingController } from './bookkeeping.controller.ts';
import { BookkeepingService } from './bookkeeping.service.ts';

@Module({
  controllers: [BookkeepingController],
  providers: [BookkeepingService],
  exports: [BookkeepingService],
})
export class BookkeepingModule {}
