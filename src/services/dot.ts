import { Service } from './service';
import { ApiPromise, HttpProvider } from '@polkadot/api';
import {
  DotRewardDestination,
  DotStakeOptions,
  DotTx,
  DotTxStatus,
  SubmittedDotTx,
} from '../types/dot';
import { DotFbSigner } from '../integrations/dot_fb_signer';
import { Signer } from '@polkadot/api/types';
import { SignerOptions } from '@polkadot/api/submittable/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { ADDRESSES } from '../globals';
import { ServiceProps } from '../types/service';
import { Integration } from '../types/integrations';

const DOT_TO_PLANCK = 10000000000;


/**
 * Staking docs: https://paritytech.github.io/substrate/master/pallet_staking/struct.Pallet.html
 */
export class DotService extends Service {
  private rpc: string;

  constructor({ testnet }: ServiceProps) {
    super({ testnet });
    this.rpc = this.testnet ? 'https://westend-rpc.polkadot.io' : 'https://rpc.polkadot.io';
  }

  private async getClient(): Promise<ApiPromise> {
    const provider = new HttpProvider(this.rpc);
    return await ApiPromise.create({
      provider,
      noInitWarn: true,
      initWasm: false,
    });
  }

  /**
   * Craft dot bonding transaction
   * @param accountId id of the kiln account to use for the stake transaction
   * @param stashAccount stash account address (your most secure cold wallet)
   * @param amountPlanck amount to bond in planck
   * @param options
   */
  async craftBondTx(
    accountId: string,
    stashAccount: string,
    amountPlanck: string,
    options?: DotStakeOptions,
  ): Promise<DotTx> {
    const client = await this.getClient();

    // The controller account is responsible for managing the stake,
    // it is recommended to have a separate wallet for it and keep the stash account as a cold offline wallet,
    // although it is possible for the controller account to be the same as the stash account
    const controllerAccount = options?.controllerAccount ?? stashAccount;
    const rewardsDestination = options?.rewardDestination ?? 'Staked';
    const extrinsic = await client.tx.staking.bond(controllerAccount, amountPlanck, rewardsDestination);
    return {
      from: stashAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot bonding extra token transaction (to be used if you already bonded tokens)
   * @param stashAccount stash account address
   * @param amountPlanck amount to bond extra in planck
   */
  async craftBondExtraTx(
    stashAccount: string,
    amountPlanck: string,
  ): Promise<DotTx> {
    const client = await this.getClient();
    const extrinsic = await client.tx.staking.bondExtra(amountPlanck);
    return {
      from: stashAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot rebond transaction (to be used to rebond unbonding token)
   * @param controllerAccount stash account address
   * @param amountPlanck amount to rebond in planck
   */
  async craftRebondTx(
    controllerAccount: string,
    amountPlanck: string,
  ): Promise<DotTx> {
    const client = await this.getClient();
    const extrinsic = await client.tx.staking.rebond(amountPlanck);
    return {
      from: controllerAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot nominate transaction
   * @param controllerAccount controller account address
   * @param validatorAddresses validator addresses to nominate to, if not provided, will nominate to Kiln's validator
   */
  async craftNominateTx(
    controllerAccount: string,
    validatorAddresses?: string[],
  ): Promise<DotTx> {
    const validators: string[] = validatorAddresses ?? this.testnet ? [ADDRESSES.dot.testnet.validatorAddress] : [ADDRESSES.dot.mainnet.validatorAddress];
    const client = await this.getClient();
    const extrinsic = await client.tx.staking.nominate(validators);
    return {
      from: controllerAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot unbonding transaction, there is an unbonding period before your tokens can be withdrawn
   * @param controllerAccount controller account address
   * @param amountPlanck amount to unrebond in planck
   */
  async craftUnbondTx(
    controllerAccount: string,
    amountPlanck: string,
  ): Promise<DotTx> {
    const client = await this.getClient();
    const extrinsic = await client.tx.staking.unbond(amountPlanck);
    return {
      from: controllerAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot withdraw unbonded token transaction
   * @param controllerAccount controller account address
   */
  async craftWithdrawUnbondedTx(
    controllerAccount: string,
  ): Promise<DotTx> {
    const client = await this.getClient();
    const spanCount = await client.query.staking.slashingSpans(controllerAccount);
    const extrinsic = await client.tx.staking.withdrawUnbonded(spanCount.toHex());
    return {
      from: controllerAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot chill transaction that chills the controller account associated
   * to the given stash account, meaning that given account will not nominate
   * any validator anymore, so you will stop earning rewards at the beginning
   * of the next era.
   * @param controllerAccount controller account address
   */
  async craftChillTx(
    controllerAccount: string,
  ): Promise<DotTx> {
    const client = await this.getClient();
    const extrinsic = await client.tx.staking.chill();
    return {
      from: controllerAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot set controller transaction that updates the controller for the given stash account
   * @param stashAccount stash account address
   * @param controllerAccount controller account address
   */
  async craftSetControllerTx(
    stashAccount: string,
    controllerAccount: string,
  ): Promise<DotTx> {
    const client = await this.getClient();
    const extrinsic = await client.tx.staking.setController(controllerAccount);
    return {
      from: stashAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Craft dot set reward destination transaction that updates the destination rewards address for the given stash account
   * @param controllerAccount controller account address
   * @param rewardsDestination:
   *  'Staked': rewards are paid into the stash account, increasing the amount at stake accordingly.
   *  'Stash': rewards are paid into the stash account, not increasing the amount at stake.
   *  'Controller': rewards are paid into the controller account
   *  Custom account address: rewards are paid into the custom account address
   */
  async craftSetPayeeTx(
    controllerAccount: string,
    rewardsDestination: DotRewardDestination,
  ): Promise<DotTx> {
    const client = await this.getClient();
    const extrinsic = await client.tx.staking.setPayee(rewardsDestination);
    return {
      from: controllerAccount,
      submittableExtrinsic: extrinsic,
    };
  }

  /**
   * Sign transaction with given integration
   * @param integration
   * @param transaction
   * @param note
   */
  async sign(integration: Integration, transaction: DotTx, note?: string): Promise<SubmittableExtrinsic> {
    const fbNote = note ? note : 'DOT tx from @kilnfi/sdk';
    const signer = this.getSigner(integration, fbNote);
    const options: Partial<SignerOptions> = {
      era: 0,
      signer: signer,
    };
    return await transaction.submittableExtrinsic.signAsync(transaction.from, options);
  }

  /**
   * Broadcast signed transaction
   * @param transaction
   */
  async broadcast(transaction: SubmittableExtrinsic): Promise<SubmittedDotTx> {
    const submittedExtrinsic = await transaction.send();
    const client = await this.getClient();
    const currentBlockHash = await client.rpc.chain.getBlockHash();
    return {
      blockHash: currentBlockHash.toString(),
      hash: submittedExtrinsic.toString(),
    };
  }

  /**
   * Get transaction status
   * @param transaction submitted dot transaction
   */
  async getTxStatus(
    transaction: SubmittedDotTx,
  ): Promise<DotTxStatus> {
    const client = await this.getClient();
    // Get block
    const block = await client.rpc.chain.getBlock(transaction.blockHash);
    if (!block) {
      throw new Error(`Could find block ${transaction.blockHash}`);
    }

    // Get extrinsic in block
    const extrinsic = block.block.extrinsics.find(ext => ext.hash.toString() === transaction.hash);
    const extrinsicIndex = block.block.extrinsics.findIndex(ext => ext.hash.toString() === transaction.hash);
    if (!extrinsic) {
      throw new Error(`Could find extrinsic ${transaction.hash} in block ${transaction.blockHash}`);
    }

    // Get block events
    const apiAt = await client.at(block.block.header.hash);
    const allEventsResponse = await apiAt.query.system.events();

    // @ts-ignore
    const filteredEvents = allEventsResponse.filter(({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex));

    let status: 'success' | 'error' = 'error';
    let error;

    // Inspect each event to check for failed and success events
    for (const event of filteredEvents) {
      if (client.events.system.ExtrinsicSuccess.is(event.event)) {
        status = 'success';
        error = null;
        break;
      } else if (client.events.system.ExtrinsicFailed.is(event.event)) {
        status = 'error';
        const dispatchError = event.event.data?.dispatchError;
        // decode the error
        if (dispatchError.isModule) {
          // for module errors, we have the section indexed, lookup
          // (For specific known errors, we can also do a check against the
          // api.errors.<module>.<ErrorName>.is(dispatchError.asModule) guard)
          const decoded = client.registry.findMetaError(dispatchError.asModule);
          error = `${decoded.section}.${decoded.name}`;
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          error = dispatchError.toString();
        }
      } else {
        status = 'error';
        error = 'Unknown error';
      }
    }

    return {
      status,
      extrinsic,
      error,
    };
  }

  /**
   * Get correct signer given integration. (only support fireblocks provider for now)
   * @param integration
   * @param note
   * @private
   */
  private getSigner(integration: Integration, note?: string): Signer {
    const fbSdk = this.getFbSdk(integration);
    return new DotFbSigner(fbSdk, integration.vaultId, this.testnet ? 'WND' : 'DOT', note);
  }
}
