import { Injectable, Logger } from '@nestjs/common';
import { CasinocoinAPI } from '@casinocoin/libjs';
import * as config from 'yaml-config';
import { GetServerInfoResponse } from '@casinocoin/libjs/common/serverinfo';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CasinocoinService {

  private settings;
  public cscAPI: CasinocoinAPI;
  public serverInfo: GetServerInfoResponse;
  private availableServers: string[];
  public serverConnectedSubject = new BehaviorSubject<boolean>(false);
  private currentServer: string;
  private disconnectedServer: string;

  constructor() {
    Logger.log('### CasinocoinService() ###');
    this.settings = config.readConfig('config.yml');
    this.availableServers = JSON.parse(this.settings.casinocoinServers);
    Logger.log('### CasinoCoinService - availableServers: ' + JSON.stringify(this.availableServers));
    // server connection handling
    this.serverConnectedSubject.subscribe( async connected => {
        if (!connected) {
            // find available server and connect
            for (const serverItem of this.availableServers) {
                Logger.log('#### CasinoCoinService - Try Server: ' + serverItem);
                if (this.disconnectedServer === serverItem) {
                    // skip server as it was the cause for the disconnect
                    Logger.log('#### CasinoCoinService - Skip server as it was the cause for the disconnect');
                } else {
                    this.cscAPI = new CasinocoinAPI({ server: serverItem });
                    try {
                        await this.cscAPI.connect();
                        Logger.log('#### CasinoCoinService - connect() result: ' + this.cscAPI.isConnected());
                        if (this.cscAPI.isConnected()) {
                            this.currentServer = serverItem;
                            this.disconnectedServer = undefined;
                            // get server info
                            this.serverInfo = await this.cscAPI.getServerInfo();
                            // start listening for disconnect
                            this.handleDisconnect();
                            // publish connected
                            this.serverConnectedSubject.next(true);
                            // stop looping available servers
                            break;
                        }
                    } catch (error ) {
                        Logger.log('### CasinoCoinService - connection failed: ' + JSON.stringify(error));
                        Logger.log('### CasinoCoinService - connection failed, try next server');
                    }
                }
            }
            // check if we now have a connection
            if (this.cscAPI.isConnected() === false) {
                // still not connected .... wait 30 seconds and retry
                Logger.log('### CasinoCoinService - All servers failed, wait 30 seconds and retry');
                await new Promise(r => setTimeout(r, 30000));
                this.serverConnectedSubject.next(false);
            }
        } else {
            Logger.log('#### CasinoCoinService - connected?: ' + this.cscAPI.isConnected());
        }
    });
    // if (this.cscAPI === undefined || this.cscAPI.isConnected() === false) {
    //     this.serverConnectedSubject.next(false);
    // } else if (this.cscAPI.isConnected() === true) {
    //     this.serverConnectedSubject.next(true);
    // }
  }

  handleDisconnect() {
    this.cscAPI.on('disconnected', () => {
        Logger.log('#### CasinoCoinService - Server Caused Disconnect: ' + this.currentServer);
        this.disconnectedServer = this.currentServer;
        this.serverConnectedSubject.next(false);
    });
  }

  async getTx(TxID) {
    const tx = await this.cscAPI.getTransaction(TxID);
    if (!tx) { return null; }
    return tx;
  }

  async getLedgerActually() {
    try {
      const ledgerActually = await this.cscAPI.getLedgerVersion();
      console.log('ledgerActually', ledgerActually);
      if (!ledgerActually) { return null; }
      return ledgerActually;
    } catch (error) {
      console.log('error get last ledger from casinocoin' + error);
    }
  }
}
