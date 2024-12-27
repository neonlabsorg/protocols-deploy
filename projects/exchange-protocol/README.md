# Exchange Protocol

## Description

This repo includes core and peripheral contracts from Uniswap V2.

## Compile solidity code

```zsh
npm run compile
```

## Contracts deployment to NeonEVM

Add `.env` file with `DEPLOYER_PRIVATE_KEY` then run:

```zsh
npm run deploy:devnet // NeonEVM devnet deployment
```

```zsh
npm run deploy:mainnet // NeonEVM mainnet deployment
```