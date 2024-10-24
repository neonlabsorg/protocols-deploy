# 1inch Limit Order protocol on Neon EVM

The following repo represents an instance of the 1inch's Limit Order protocol deployed on Neon EVM. The protocol is deployed & verified at [https://neon.blockscout.com/address/0xF40dd8107EEc3397Ab227cA67a536436e0bd80C8](https://neon.blockscout.com/address/0xF40dd8107EEc3397Ab227cA67a536436e0bd80C8).

### Deploy
```npx hardhat run scripts/deploy.js --network neonmainnet```

### Testing
```npx hardhat test test/TestLimitOrderProtocol.js --network neonmainnet```

Returns the following output:

```
1inch limit order protocol tests:
0x011910f2ccff811c8fd645b14ccda1d4b7a627618655140d28e6e18e9ccb5879 cancelOrder tx
      ✔ Test cancel order
0xd530d340df3e50d313bdc63c1f4e6cbba9bea200987375b11d41e389ae8f4f5c maker approval tx
0x46cba073b97e43efc1929265f3ddb2d3cae55d54ac88406a130fcac2199a0d79 taker approval tx
0x16671b47844afdf02bf3ee03da32ca2bc06401929f9bfac674f6a5f64f497521 fillOrder tx
      ✔ Test filling order from an EOA
0x567e2e550248efdcd260a0d897179d0d0d076fc67528a77c979f67a5ac07385d maker approval tx
0xd4f1add16cb1716c033184c58bcc3b4216d2063e84f9221aaa29a9256959e3ad taker load tx
0x4a68aecac0eccc5375f4319a4a8abb49576126ce0b635f6a668b71dd1da4f03c fillOrder tx
      ✔ Test filling order from a smart contract
```