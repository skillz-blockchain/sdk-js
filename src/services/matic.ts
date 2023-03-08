import api from '../api';
import { Service } from './service';
import { utils } from 'ethers';
import { ServiceProps } from '../types/service';
import {
  MaticSignedTx, MaticStakeTxOptions,
  MaticTx,
  MaticTxHash,
  MaticTxStatus,
} from '../types/matic';

export class MaticService extends Service {
  constructor({ testnet, integrations }: ServiceProps) {
    super({ testnet, integrations });
  }

  /**
   * Craft an approve transaction
   * @param walletAddress wallet address signing the transaction
   * @param contractAddressToApprove contract address that you allow to spend the token
   * @param amountWei how many tokens to approve the spending, if not specified an infinite amount will be approved
   */
  async craftApproveTx(
    walletAddress: string,
    contractAddressToApprove: string,
    amountWei?: string,
  ): Promise<MaticTx> {
    try {
      const { data } = await api.post<MaticTx>(
        `/v1/matic/transaction/approve`,
        {
          wallet: walletAddress,
          contract: contractAddressToApprove,
          amount_wei: amountWei,
        });
      return data;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Craft a MATIC buy shares transaction on Kiln's ValidatorShare proxy contract
   * @param accountId id of the kiln account to use for the stake transaction
   * @param walletAddress withdrawal creds /!\ losing it => losing the ability to withdraw
   * @param amountWei how many tokens to stake in WEI
   * @param options options to pass a custom ValidatorShare proxy contract address
   */
  async craftStakeTx(
    accountId: string,
    walletAddress: string,
    amountWei: string,
    options?: MaticStakeTxOptions,
  ): Promise<MaticTx> {
    try {
      const { data } = await api.post<MaticTx>(
        `/v1/matic/transaction/stake`,
        {
          account_id: accountId,
          wallet: walletAddress,
          amount_wei: amountWei,
          options: options,
        });
      return data;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Craft a MATIC sell shares transaction on the validator shares smart contract
   * @param walletAddress address delegating
   * @param amountWei how many tokens to stake in WEI
   * @param options options to pass a custom ValidatorShare proxy contract address
   */
  async craftUnStakeTx(
    walletAddress: string,
    amountWei: string,
    options?: MaticStakeTxOptions,
  ): Promise<MaticTx> {
    try {
      const { data } = await api.post<MaticTx>(
        `/v1/matic/transaction/unstake`,
        {
          wallet: walletAddress,
          amount_wei: amountWei,
          options: options,
        });
      return data;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Sign transaction with given integration
   * @param integration
   * @param tx
   * @param note
   */
  async sign(integration: string, tx: MaticTx, note?: string): Promise<MaticSignedTx> {
    if (!this.integrations?.find(int => int.name === integration)) {
      throw new Error(`Unknown integration, please provide an integration name that matches one of the integrations provided in the config.`);
    }

    if (!this.fbSigner) {
      throw new Error(`Could not retrieve fireblocks signer.`);
    }


    try {
      const payload = {
        rawMessageData: {
          messages: [
            {
              'content': tx.data.unsigned_tx_hash,
            },
          ],
        },
      };

      const signatures = await this.fbSigner.signWithFB(payload, this.testnet ? 'ETH_TEST3' : 'ETH', note);
      const { data } = await api.post<MaticSignedTx>(
        `/v1/matic/transaction/prepare`,
        {
          unsigned_tx_serialized: tx.data.unsigned_tx_serialized,
          r: `0x${signatures?.signedMessages?.[0].signature.r}`,
          s: `0x${signatures?.signedMessages?.[0].signature.s}`,
          v: signatures?.signedMessages?.[0].signature.v ?? 0,
        });
      return data;
    } catch (err: any) {
      throw new Error(err);
    }
  }


  /**
   * Broadcast transaction to the network
   * @param signedTx
   */
  async broadcast(signedTx: MaticSignedTx): Promise<MaticTxHash> {
    try {
      const { data } = await api.post<MaticTxHash>(
        `/v1/matic/transaction/broadcast`,
        {
          tx_serialized: signedTx.data.signed_tx_serialized,
        });
      return data;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Get transaction status
   * @param txHash: transaction hash
   */
  async getTxStatus(txHash: string): Promise<MaticTxStatus> {
    try {
      const { data } = await api.get<MaticTxStatus>(
        `/v1/matic/transaction/status?tx_hash=${txHash}`);
      return data;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Utility function to convert MATIC to WEI
   * @param matic
   */
  maticToWei(matic: string): string {
    return utils.parseEther(matic).toString();
  }
}
