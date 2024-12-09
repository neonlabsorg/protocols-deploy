require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-vyper");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
        compilers:[
            {
                version: '0.8.28',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    viaIR: true,
                },
            },
        ],
  },
  vyper: {
        version: "0.3.9", // Replace with the Vyper version installed
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
    neondevnet: {
        url: "https://devnet.neonevm.org",
        accounts: [process.env.PRIVATE_KEY_OWNER, process.env.USER1_KEY],
        chainId: 245022926,
        allowUnlimitedContractSize: false,
        gas: "auto",
        gasPrice: "auto",
    },
    neonmainnet: {
        url: "https://mainnet-proxy.neonevm.org",
        accounts: [process.env.PRIVATE_KEY_OWNER, process.env.USER1_KEY],
        chainId: 245022934,
        allowUnlimitedContractSize: false,
        gas: "auto",
        gasPrice: "auto",
    },
    curvestand: {
        url: "https://curve-stand.neontest.xyz/",
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
