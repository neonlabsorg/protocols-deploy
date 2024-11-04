# PancakeSwap predictions with SPLTokens on Neon EVM

The following repo represents an instance of the PancakeSwaps's predictions protocol with **WSOL** SPLToken deployed on Neon EVM. The protocol is deployed & verified at [https://neon-devnet.blockscout.com/address/0x445d9a385902312cB87AA366342dD634ced85F95](https://neon-devnet.blockscout.com/address/0x445d9a385902312cB87AA366342dD634ced85F95).

### Deploy
```npx hardhat run scripts/deploy.js --network neondevnet```

### Testing
```npx hardhat test test/TestLimitOrderProtocol.js --network neondevnet§```

* BULL betting WSOL on **UP** - [transaction hash](https://neon-devnet.blockscout.com/tx/0x5c4d51378fa7914d1853818bb75b857c850f88dea553d5592963541cd5bd81be)
* BEAR betting WSOL on **DOWN** - [transaction hash](https://neon-devnet.blockscout.com/tx/0x5963eb998c039d6022f545f24ccb7aee90addeecc5bce944b08f025d2ca681a0)
* The protocol operator refreshing the current round & picking a winner side _( BULL )_ - [transaction hash](https://neon-devnet.blockscout.com/tx/0xcb7c8537a9cebb835d9c43aa85c50ed025c799c23b3d66d106d45b64a8cae35b)
* BULL claiming his WSOL reward - [transaction hash](https://neon-devnet.blockscout.com/tx/0x77b2cb6ed9fc5c91be1de420553d70ce56f501b5255547bfa38a433eb3af913d)