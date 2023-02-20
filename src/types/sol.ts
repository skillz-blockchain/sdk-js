import { Transaction, TransactionResponse } from '@solana/web3.js';
import { Integrations } from "./integrations";

export type InternalSolanaConfig = {
  testnet?: boolean;
  integrations: Integrations | undefined;
};

export type SolanaTx = Transaction;

type Epoch = {
  nb: number;
  begin_at: string;
};

export type StakeState = 'activating' | 'active' | 'deactivating' | 'inactive';

export type SolStake = {
  stake_account: string;
  withdraw_pubkey: string;
  balance: string;
  rewards: string;
  activation_epoch: Epoch | null;
  deactivation_epoch: Epoch | null;
  state: StakeState;
  net_apy: number;
  vote_account: string;
};

export type SolStakes = {
  data: SolStake[];
}

export type SolReward = {
  epoch: Epoch;
  rewards: number;
  net_apy: number;
};

export type SolRewards = {
  data: SolReward[];
}

export type SolNetworkStats = {
  data: {
    timestamp: string;
    nb_validators: number;
    apy: number;
    supply_staked_percent: number;
  };
};

export type SolanaStakeOptions = {
  voteAccountAddress?: string;
  memo?: string;
};

export type TaggedStake = {
  stakeAccount: string;
  balance: number;
};

export type PublicNonceAccountInfo = {
  nonce_account: string;
  nonce_account_authority: string;
};

export type PublicSignature = {
  pubkey: string;
  signature: string | null;
};

export type SolanaTxStatus = {
  status: 'success' | 'error';
  txReceipt: TransactionResponse | null;
}