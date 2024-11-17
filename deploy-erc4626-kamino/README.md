# 1inch Limit Order protocol on Neon EVM

The following repo represents an instance of the 1inch's Limit Order protocol deployed on Neon EVM. The protocol is deployed & verified at [https://neon.blockscout.com/address/0xF40dd8107EEc3397Ab227cA67a536436e0bd80C8](https://neon.blockscout.com/address/0xF40dd8107EEc3397Ab227cA67a536436e0bd80C8).

### Deploy
```npx hardhat run scripts/deploy.js --network neonmainnet```

### Testing
```npx hardhat test test/TestLimitOrderProtocol.js --network neonmainnet```

Returns the following output:

```
1inch limit order protocol tests:
0x3752eb1d3c205ed9c3f108e7e1bb6dde0292ad5d020a23d51309c5825544d805 cancelOrder tx
      ✔ Test cancel order
0x3ade576a517d5c9c91af11db45fb7be46b6814bb7683f2f73dfc110192c49355 maker approval tx
0xe4dc6372fcbff4bf4374df48099c5f2377c4930bcf0efb2e529c7db2de313738 taker approval tx
0x1fe99cfafc211810141195836ecd71df0b21fca3be64d12d7a8bfdec5389b13f fillOrder tx
      ✔ Test filling order from an EOA ( USDC => WNEON order )
0x970c016add0e7affd8aa1f6b98ece1aadb55bf033b5a45b112bf3b52b9616586 maker approval tx
0x7f8bbb69aefc12b8289fa8018db571ccbae52fa83d3336d79a773d83a2431625 taker approval tx
0x118d1b1aad690ba885dd4b3fa1e26574401c4abfee7b64cfda46dd9c5e289e03 fillOrder tx
      ✔ Test filling order from an EOA ( USDC => WSOL order )
0xb045b9417300f7154daff20ef20b329d60f6cb9984872a06992f5b3a95fbaef1 maker approval tx
0x5128978acf2e67ea7159c14d9d82a40025e406aa712f3d23447a7bece3e75a3f taker load tx
0x019b7fc4ac70c17edfcda13f9f1a7237ec8d2a958491fd83fe233a262ae6e1f6 fillOrder tx
      ✔ Test filling order from a smart contract ( USDC => WNEON order )
```