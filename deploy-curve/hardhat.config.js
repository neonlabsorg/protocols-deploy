require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
        compilers:[
            {
                version: '0.8.28',
            },
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
              apiURL: "https://neon-devnet.blockscout.com/api",
              browserURL: "https://neon-devnet.blockscout.com",
            },
          },
          {
            network: "neonevm",
            chainId: 245022934,
            urls: {
              apiURL: "https://neon.blockscout.com/api",
              browserURL: "https://neon.blockscout.com",
            },
          },
    ],
  },
  networks: {
    curvestand: {
      url: process.env.EVM_NODE,
      accounts: [process.env.PRIVATE_KEY_OWNER, process.env.USER1_KEY],
      allowUnlimitedContractSize: false,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  mocha: {
      timeout: 2800000
  }
};
