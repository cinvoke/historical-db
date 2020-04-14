import { Module, Global } from '@nestjs/common';
import { CasinocoinService } from '../casinocoin/casinocoin.service';

@Global()
@Module({
  providers: [
    CasinocoinService,
  ],
  exports: [
    CasinocoinService,
  ],
})
export class GlobalModule {}

