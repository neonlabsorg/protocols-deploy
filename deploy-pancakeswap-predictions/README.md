# PancakeSwap predictions on Neon EVM

The following repo represents an instance of the PancakeSwaps's predictions protocol deployed on Neon EVM. The protocol is deployed & verified at [https://neon-devnet.blockscout.com/address/0x88F4d22ba3118F2572AE904d3b271A1068c77aC3](https://neon-devnet.blockscout.com/address/0x88F4d22ba3118F2572AE904d3b271A1068c77aC3).

### Deploy
```npx hardhat run scripts/deploy.js --network neonmainnet```

### Manual tests
* User X betting on **UP** - [transaction hash](https://neon-devnet.blockscout.com/tx/0x335209a25629c6a0e704eb18120f7561a19a04975ed501a7d0af23b176c218ac)
* User Y betting on **DOWN** - [transaction hash](https://neon-devnet.blockscout.com/tx/0xfab89b5c05df8fe158886a27d084b04d243034d8d50738e02777935885a7719d)
* The protocol operator refreshing the current round & picking a winner side - [transaction hash](https://neon-devnet.blockscout.com/tx/0x147583b4fa3da608ade90ab1c04759aa3f54085e697bbd13d9abf90f952f5e48)
* User Y claiming his rewards - [transaction hash](https://neon-devnet.blockscout.com/tx/0x1b8e87aa5829ff19338ddc5b2f10797e892dcbf497d50b064ae7580bf63e97e8)