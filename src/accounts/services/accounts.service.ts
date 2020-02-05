import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accounts } from '../entity/account.entity';
import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
const settings = config.readConfig('config.yml');

@Injectable()
export class AccountsService {

    private cscApi: CasinocoinAPI = new CasinocoinAPI({ server: settings.casinocoinServer });

    constructor(
      @InjectRepository(Accounts)
      private readonly accountRepository: Repository<Accounts>,
    ) {
    }

    getAll(): Promise<Accounts[]> {
      return this.accountRepository.find();
    }

    getAccount(account: string): Promise<Accounts> {
      return this.accountRepository.findOne({accountId : account});
    }

    async getTokens() {
      this.cscApi.connect().then((value) => {
        this.cscApi.getConfigInfo('Token').then(configResult => {
          console.log('configResult', configResult);
        });
      });
    }
}
