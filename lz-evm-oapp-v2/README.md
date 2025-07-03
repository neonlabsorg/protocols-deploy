# L0 V2 dApp example
This project is a dummy dApp that connects Sepolia and Holesky testnets via L0 V2 integration.

### Steps to test:
* Run `npm i` to install the required packages
* Make a copy of `.env.example` file, rename it to `.env` and place inside of it your EVM private key and RPCs for Sepolia and Holesky testnets
* Airdrop some Sepolia and Holesky ETH to your address
* Submitting message from Sepolia to Holesky - `npx hardhat test test/TestL0.js --network sepolia`
* Submitting message from Holesky to Sepolia - `npx hardhat test test/TestL0.js --network holesky`

### Flow of L0 V2:
* Deploy two `TestOApp` smart contracts for each chain which inherits the L0's abstract class `OApp`
* Both `TestOApp` instances have to whitelist each other through method `setPeer` [[more info here]](https://github.com/LayerZero-Labs/devtools/blob/main/packages/oapp-evm/contracts/oapp/OAppCore.sol#L43)
* After the whitelisting is done now both contracts are ready to communicate to each other through method `_lzSend` [[more info here]](https://github.com/LayerZero-Labs/devtools/blob/main/packages/oapp-evm/contracts/oapp/OAppSender.sol#L74). After the L0's DVN network verifies that the cross-chain message is legit then it requests the receiver contract's `lzReceive` method [[more info here]](https://github.com/LayerZero-Labs/devtools/blob/main/packages/oapp-evm/contracts/oapp/OAppReceiver.sol#L95).