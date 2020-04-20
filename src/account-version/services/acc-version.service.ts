import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountVersions } from '../entity/accountVersion.entity';
import { Repository } from 'typeorm';
import { InfoAccountDTO } from '../../sync-process/class/dto/infoAccountDTO';

@Injectable()
export class AccVersionService {

  private readonly logger = new Logger(AccVersionService.name);
  constructor(
  @InjectRepository(AccountVersions)
    private readonly accountVersions: Repository<AccountVersions>,
  ) {
  }

  async getAccountVersion(body) {
  const { ledgerVersion, accountId } = body;
  return await this.accountVersions.createQueryBuilder('accountVersion')
      .where('accountVersion.ledgerVersion = :ledgerVersion', { ledgerVersion })
      .andWhere('accountVersion.accountId = :accountId', { accountId })
      .getOne();
  }

  // -----------------------------------------------Synch Process ------------------------------------------------------
  // tslint:disable-next-line:max-line-length
  public async insertNewAccountVersion(account, getBalancesAccount,  getInfoAccount: InfoAccountDTO, elements: {ledgerHash, ledger, id, ledgerTimestamp, parent, sequence}, kycVersionLedger) {
    const newAccountVersion = new AccountVersions();
    newAccountVersion.accountId = account;
    newAccountVersion.balances = getBalancesAccount;
    newAccountVersion.ledgerHash = elements.ledgerHash;
    newAccountVersion.ledgerVersion = elements.ledger;
    newAccountVersion.ownerCount = getInfoAccount.ownerCount;
    newAccountVersion.previousAffectingTransactionID = getInfoAccount.previousAffectingTransactionID;
    newAccountVersion.previousAffectingTransactionLedgerVersion = getInfoAccount.previousAffectingTransactionLedgerVersion;
    newAccountVersion.previousInitiatedTransactionID = elements.id;
    newAccountVersion.sequence = elements.sequence;
    newAccountVersion.ledgerTimestamp = elements.ledgerTimestamp;
    newAccountVersion.kyc = kycVersionLedger;
    // insert new accountVersion
    await this.accountVersions.save(newAccountVersion);
    console.log(`insert VersionAccount ${account}`);
  }
}
