require('babel-register')
require('babel-polyfill')
require('dotenv/config')
const HDWalletProvider = require('@truffle/hdwallet-provider')

const mnemonicPhrase = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"

module.exports = {
  contracts_directory: "./contracts/compound-protocol", // for `version: '^0.5.16'`
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(
          mnemonicPhrase,
          process.env.INFURA_KOVAN_API_URL
        )
      },
      network_id: '3',
    },
  },
  compilers: {
    solc: {
      version: '^0.5.16', // for `contracts_directory: "./contracts/compound-protocol"`
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  }
}
