# ERC4626 with Kamino on Neon EVM
The following repo represents a showcase of how an EVM Solidity smart contract can initiate read and write requests to Solana's state. The smart contract does not have a reward logic on the Solidity level, but instead the operator should once in a while perform risk management and move the protocol's assets to profitable protocols on Solana. For example in the tests the operator forwards the majority of the protocol's assets into a lending protocol on Solana _( [Kamino](https://app.kamino.finance/) )_. There is a buffer amount always available in the protocol to handle immediate user withdraws. The risk management part for the operator includes tracking of the protocol's asset balance via script and making sure that the protocols always maintains the buffer amount to handle user withdraws. The smart contract is deployed and verified at [https://neon.blockscout.com/address/0xaD162799C30c7D915b047013Ad2C3A84DEB20c72](https://neon.blockscout.com/address/0xaD162799C30c7D915b047013Ad2C3A84DEB20c72).

### Key Features
* Cross-chain interaction: Read and write to Solana's state from an EVM-based chain.
* ERC4626 compliance: Standardized asset management for deposits and withdrawals.
* Protocol-level asset management: Operator-driven risk management and asset reallocation on Solana.

### Actors
* Users:
    * Can deposit and withdraw assets.
    * Receive or redeem shares representing their deposit.
* Operator:
    * The owner of the smart contract.
    * Responsible for managing protocol assets, including:
    * Performing risk management.
    * Allocating assets to profitable protocols on Solana.
    * Ensures the protocol maintains a buffer for immediate user withdrawals.

### Examples
* [https://neon.blockscout.com/tx/0xfdf8c306615e8a86b27e9eebd32eeeb2261cf690a0fe7585ecf7ae8d61a0dec7](https://neon.blockscout.com/tx/0xfdf8c306615e8a86b27e9eebd32eeeb2261cf690a0fe7585ecf7ae8d61a0dec7) - The user deposits USDC into the protocol and is being minted shares of the vault
* [https://neon.blockscout.com/tx/0x6d724c4b886d558281d28266c535bb925e005aa52f52d452d34ed3265a6085b3](https://neon.blockscout.com/tx/0x6d724c4b886d558281d28266c535bb925e005aa52f52d452d34ed3265a6085b3) - The operator deposits the protocol's balance to Kamino ( minus the buffer amount that always should be presenting in the protocol )
* [https://neon.blockscout.com/tx/0x5cc9883eb7ee9b4ef0ecc40b2d525a65f0ab8cfaf07596265b1cb2337b3ae8f4](https://neon.blockscout.com/tx/0x5cc9883eb7ee9b4ef0ecc40b2d525a65f0ab8cfaf07596265b1cb2337b3ae8f4) - The operator withdrawing the full deposit from Kamino
* [https://neon.blockscout.com/tx/0x9eb0d814e4fd78294978dbf3aa63115fbdebc82ea4bd82a0cf20d3a731e7c34a](https://neon.blockscout.com/tx/0x9eb0d814e4fd78294978dbf3aa63115fbdebc82ea4bd82a0cf20d3a731e7c34a) - The user burning his vault shares and receiving back his initial deposit plus potential profits

### Testing
```npx hardhat test test/TestERC4626Kamino.js --network neonmainnet```

### Note
The following code is for demonstration purposes only and should not be used directly for mainnet deployments. When using the example, you should generally explore the code and modify and test it according to the business logic of your smart contract.