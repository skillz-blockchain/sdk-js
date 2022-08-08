export const ADDRESSES = {
  eth: {
    abi: '[{"inputs":[{"internalType":"address","name":"deposit_contract_address","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"LogDepositLeftover","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"pubkey","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"withdrawal","type":"bytes"}],"name":"LogDepositSent","type":"event"},{"inputs":[],"name":"kDepositAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"bytes[]","name":"pubkeys","type":"bytes[]"},{"internalType":"bytes[]","name":"withdrawal_credentials","type":"bytes[]"},{"internalType":"bytes[]","name":"signatures","type":"bytes[]"},{"internalType":"bytes32[]","name":"deposit_data_roots","type":"bytes32[]"}],"name":"batchDeposit","outputs":[],"stateMutability":"payable","type":"function","payable":true}]',
    testnet: {
      depositContract: '0x5FaDfdb7eFffd3B4AA03f0F29d9200Cf5F191F31',
    },
    mainnet: {
      depositContract: '0x9b8c989FF27e948F55B53Bb19B3cC1947852E394',
    }
  },
  sol: {
    testnet: {
      voteAccountAddress: 'BnG7nNXivdcwVoeuHmE7UL6KUHufJMiqouX6dz22X6LZ'
    },
    mainnet: {
      voteAccountAddress: 'DdCNGDpP7qMgoAy6paFzhhak2EeyCZcgjH7ak5u5v28m'
    }
  }
};
