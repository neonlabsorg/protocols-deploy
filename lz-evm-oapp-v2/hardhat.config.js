require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
        compilers:[
            {
              version: '0.8.28',
              settings: {
                evmVersion: "cancun",
                viaIR: true,
                optimizer: {
                    enabled: true,
                    runs: 200
                }
              }
            }
        ],
  },
  etherscan: {
    apiKey: {
      neonevm: "test",
    },
    customChains: [
      {
        network: "neonevm",
        chainId: 245022926,
        urls: {
          apiURL: "https://devnet-api.neonscan.org/hardhat/verify",
          browserURL: "https://devnet.neonscan.org",
        },
      },
      {
        network: "neonevm",
        chainId: 245022934,
        urls: {
          apiURL: "https://api.neonscan.org/hardhat/verify",
          browserURL: "https://neonscan.org",
        },
      },
    ],
  },
  networks: {
    neondevnet: {
      url: "https://devnet.neonevm.org",
      accounts: [process.env.PRIVATE_KEY_OWNER],
      chainId: 245022926,
      allowUnlimitedContractSize: false,
      gas: "auto",
      gasPrice: "auto",
    },
    neonmainnet: {
      url: "https://neon-proxy-mainnet.solana.p2p.org",
      accounts: [process.env.PRIVATE_KEY_OWNER],
      chainId: 245022934,
      allowUnlimitedContractSize: false,
      gas: "auto",
      gasPrice: "auto",
    },
    sepolia: {
        url: process.env.SEPOLIA_RPC,
        accounts: [process.env.PRIVATE_KEY_OWNER],
        tags: ['test']
    },
    holesky: {
        url: process.env.HOLESKY_RPC,
        accounts: [process.env.PRIVATE_KEY_OWNER],
        tags: ['test']
    },
  },
  mocha: {
    timeout: 5000000
  }
};
