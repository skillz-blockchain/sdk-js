import { TransactionReceipt } from 'web3-core';

export type MaticTx = {
  data: {
    unsigned_tx_hash: string;
    unsigned_tx_serialized: string;
    to: string;
    contract_call_data: string;
    amount_wei?: string;
    nonce: number;
    gas_limit: number;
    max_priority_fee_per_gas_wei: string;
    max_fee_per_gas_wei: string;
    chain_id: number;
  }
};

export type MaticTxHash = {
  data: {
    tx_hash: string;
  }
};

export type MaticTxStatus = {
  data: {
    status: 'success' | 'error' | 'pending_confirmation';
    receipt: TransactionReceipt | null;
  }
}
export type MaticSignedTx = {
  data: {
    signed_tx_serialized: string;
  };
};