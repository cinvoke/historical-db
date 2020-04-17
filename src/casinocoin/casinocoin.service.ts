import { Injectable, Logger } from '@nestjs/common';
import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';

@Injectable()
export class CasinocoinService {

  private settings;
  public cscAPI: CasinocoinAPI;

  constructor() {
    this.settings = config.readConfig('config.yml');
    if (this.cscAPI === undefined) {
      this.cscAPI = new CasinocoinAPI({ server: this.settings.casinocoinServer });
    }

    if (!this.cscAPI.isConnected()) {
      // connect to server
      this.cscAPI.connect().then(() => {
        // get all Crn from CasinoCoin
        Logger.log('### CSC - Casinocoin Connected 😎');
        this.cscAPI.on('disconnected', (val) => {
          Logger.log('### CSC - Casinocoin Disconnected 😵');
          // this.cscAPI = undefined;
        });

      }).catch(error => {
        Logger.log('### CSC - Casinocoin Error 😵', JSON.stringify(error));
        // tslint:disable-next-line:no-console
        console.log(error);
      });
    }
  }

  async getTx(TxID) {
    const tx = await this.cscAPI.getTransaction(TxID);
    if (!tx) { return null; }
    return tx;
  }

  async getLedgerActually() {
    try {
      const ledgerActually = await this.cscAPI.getLedgerVersion();
      if (!ledgerActually) { return null; }
      return ledgerActually;
    } catch (error) {
      console.log('error get last ledger from casinocoin'+ error);
    }
  }
}
