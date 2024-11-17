const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const {
    Liquidity,
    TokenAmount,
    Token,
    Percent
} = require('@raydium-io/raydium-sdk');
const {
    getAssociatedTokenAddress,
    getAccount,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createTransferInstruction
} = require("@solana/spl-token");
const BN = require('bn.js');
const { config } = require('./config');

describe('TestERC4626Raydium tests:', async function () {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const ERC4626RaydiumAddress = '0xcD9C00a11d700087fe2757E9Ff793DD7C40a461B';
    let operator, user;
    let ERC4626Raydium;
    let contractPublicKey;
    let USDC;
    let WSOL;
    const depositAmount = 100000;
    const withdrawAmount = 10; // percentage
    const bufferAmount = 15; // percentage

    const swapConfig = {
        TokenA: config.DATA.SVM.ADDRESSES.USDC,
        TokenB: config.DATA.SVM.ADDRESSES.WSOL,
        PoolAB: config.DATA.SVM.ADDRESSES.RAYDIUM_SOL_USDC_POOL,
        TokenADecimals: 6,
        TokenBDecimals: 9,
        direction: "in", // Swap direction: 'in' or 'out'
        //liquidityFile: "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
        liquidityFile: "raydiumPools.json", // download from https://api.raydium.io/v2/sdk/liquidity/mainnet.json
        slippage: 0 // percents
    };

    const addLpConfig = {
        slippage: 1 // percents
    };

    if (!ethers.isAddress(ERC4626RaydiumAddress)) {
        console.log('Invalid ERC4626RaydiumAddress');
        return false;
    }

    before(async function() {
        [operator, user] = await ethers.getSigners();

        ERC4626Raydium = await ethers.getContractAt('ERC4626Raydium', ERC4626RaydiumAddress);
        USDC = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.USDC);
        WSOL = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.WSOL);

        const contractPublicKeyInBytes = await ERC4626Raydium.getNeonAddress(ERC4626RaydiumAddress);
        contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
        console.log(contractPublicKey, 'contractPublicKey');
    });

    describe('Tests:', function() {
        /* it('Test user deposit into protocol', async function () {
            const totalAssets = await ERC4626Raydium.totalAssets();
            console.log(totalAssets, 'totalAssets');
            const userBalance = await WSOL.balanceOf(user.address);
            console.log(userBalance, 'userBalance');
            const userSharesBalance = await ERC4626Raydium.balanceOf(user.address);
            console.log(userSharesBalance, 'userSharesBalance');

            let tx = await WSOL.connect(user).approve(ERC4626RaydiumAddress, depositAmount);
            await tx.wait(1);
            console.log(tx, 'approve tx');

            tx = await ERC4626Raydium.connect(user).deposit(depositAmount, user.address);
            await tx.wait(1);
            console.log(tx, 'deposit tx');

            expect(await ERC4626Raydium.totalAssets()).to.be.greaterThan(totalAssets);
            expect(userBalance).to.be.greaterThan(await WSOL.balanceOf(user.address));
            expect(await ERC4626Raydium.balanceOf(user.address)).to.be.greaterThan(userSharesBalance);
        }); */

        it('Test operator deposit to Solana', async function () {
            const totalAssets = await ERC4626Raydium.totalAssets();
            console.log(totalAssets, 'totalAssets');
            const userMaxWithdraw = await ERC4626Raydium.maxWithdraw(user.address);

            let amountToBeDepositedToSolana = (parseInt(await ERC4626Raydium.totalAssets()) / 10 ** swapConfig.TokenBDecimals) * 0.85;
            console.log(amountToBeDepositedToSolana, 'amountToBeDepositedToSolana');

            console.log('\nQuery Raydium pools data ...');
            const poolKeys = await config.raydiumHelper.findPoolInfoForTokens(swapConfig.liquidityFile, swapConfig.TokenA, swapConfig.TokenB);
            if (!poolKeys) {
                console.error('Pool info not found');
                return 'Pool info not found';
            } else {
                console.log('Found pool info');
            }

            const targetPoolInfo = await config.raydiumHelper.formatAmmKeysById(connection, swapConfig.PoolAB);
            const extraPoolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

            const ataContractTokenA = await getAssociatedTokenAddress(
                new web3.PublicKey(swapConfig.TokenA),
                new web3.PublicKey(contractPublicKey),
                true
            );

            const ataContractTokenB = await getAssociatedTokenAddress(
                new web3.PublicKey(swapConfig.TokenB),
                new web3.PublicKey(contractPublicKey),
                true
            );

            const ataContractTokenLP = await getAssociatedTokenAddress(
                new web3.PublicKey(targetPoolInfo.lpMint),
                new web3.PublicKey(contractPublicKey),
                true
            );

            console.log(ataContractTokenA, 'ataContractTokenA');
            console.log(ataContractTokenB, 'ataContractTokenB');
            console.log(ataContractTokenLP, 'ataContractTokenLP');

            // BUILD RAYDIUM SWAP INSTRUCTION
            let [amountIn, , minAmountOut] = await config.raydiumHelper.calcAmountOut(
                connection, 
                poolKeys, 
                amountToBeDepositedToSolana / 2,
                poolKeys.quoteMint.toString() == swapConfig.TokenA, 
                swapConfig.slippage
            );
            console.log(Number(amountIn.raw), 'amountIn');
            console.log(Number(minAmountOut.raw), 'minAmountOut');

            const raydiumSwap = Liquidity.makeSwapInstruction({
                poolKeys: poolKeys,
                userKeys: {
                    tokenAccountIn: ataContractTokenB,
                    tokenAccountOut: ataContractTokenA,
                    owner: new web3.PublicKey(contractPublicKey)
                },
                amountIn: amountIn.raw,
                amountOut: minAmountOut.raw,
                fixedSide: "in"
            });
            console.log(raydiumSwap.innerTransaction.instructions, 'raydiumSwap');
            // /BUILD RAYDIUM SWAP INSTRUCTION

            // BUILD RAYDIUM ADD LP INSTRUCTION
            const inputAmount = new TokenAmount(
                new Token(
                    TOKEN_PROGRAM_ID,
                    new web3.PublicKey(swapConfig.TokenA),
                    swapConfig.TokenADecimals
                ),
                minAmountOut.raw
            );
            
            const { maxAnotherAmount } = Liquidity.computeAnotherAmount({
                poolKeys,
                poolInfo: { ...targetPoolInfo, ...extraPoolInfo },
                amount: inputAmount,
                anotherCurrency: new Token(
                    TOKEN_PROGRAM_ID,
                    new web3.PublicKey(swapConfig.TokenB),
                    swapConfig.TokenBDecimals
                ),
                slippage: new Percent(addLpConfig.slippage, 100)
            });

            console.log(Number(maxAnotherAmount.raw), 'maxAnotherAmount.raw');
            console.log(Number(inputAmount.raw), 'inputAmount.raw');

            const addLiquidityInstruction = Liquidity.makeAddLiquidityInstruction({
                poolKeys,
                userKeys: {
                    baseTokenAccount: ataContractTokenB,
                    quoteTokenAccount: ataContractTokenA,
                    lpTokenAccount: ataContractTokenLP,
                    owner: new web3.PublicKey(contractPublicKey)
                },
                baseAmountIn: maxAnotherAmount.raw,
                quoteAmountIn: inputAmount.raw,
                fixedSide: 'a'
            });
            console.log(addLiquidityInstruction.innerTransaction.instructions, 'addLiquidityInstruction');
            // /BUILD RAYDIUM ADD LP INSTRUCTION

            tx = await ERC4626Raydium.connect(operator).depositToSolana(
                parseInt(amountToBeDepositedToSolana * 10 ** swapConfig.TokenBDecimals),
                [
                    config.utils.prepareInstruction(raydiumSwap.innerTransaction.instructions[0]),
                    config.utils.prepareInstruction(addLiquidityInstruction.innerTransaction.instructions[0])
                ]
            );
            await tx.wait(1);
            console.log(tx, 'tx done'); 

            expect(userMaxWithdraw).to.eq(await ERC4626Raydium.maxWithdraw(user.address));
            console.log(totalAssets, 'totalAssets');
            console.log(await ERC4626Raydium.totalAssets(), 'await ERC4626Raydium.totalAssets()');
        });

        /* it('Test operator withdraw from Solana', async function () {
            const totalAssets = await ERC4626Raydium.totalAssets();
            console.log(totalAssets, 'totalAssets');
            console.log(await connection.getAccountInfo(ReceiverAccount), 'getAccountInfo SenderAccount');
            const userMaxWithdraw = await ERC4626Raydium.maxWithdraw(user.address);
            const totalAssets = await ERC4626Raydium.totalAssets();

            const countract_cUSD_AYA = getAssociatedTokenAddressSync(
                new web3.PublicKey(config.DATA.SVM.ADDRESSES.Raydium_RESERVE_USDC), 
                new web3.PublicKey(contractPublicKey), 
                true, 
                TOKEN_PROGRAM_ID, 
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            const kUSDCTokenAmount = await connection.getTokenAccountBalance(countract_cUSD_AYA);
            console.log(kUSDCTokenAmount, 'kUSDCTokenAmount');

            const withdrawAmountFromSolana = parseInt((kUSDCTokenAmount.value.amount * withdrawAmount) / 100);
            console.log(withdrawAmountFromSolana, 'withdrawAmountFromSolana');
            
            const { market, reserve: usdcReserve } = await config.RaydiumHelper.loadReserveData({
                connection,
                marketPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.Raydium_MAIN_MARKET),
                mintPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC),
                RaydiumMarket: RaydiumMarket,
                DEFAULT_RECENT_SLOT_DURATION_MS: DEFAULT_RECENT_SLOT_DURATION_MS
            });
            const withdrawAction = await RaydiumAction.buildRedeemReserveCollateralTxns(
                market,
                new BN(withdrawAmountFromSolana),
                usdcReserve.getLiquidityMint(),
                new web3.PublicKey(contractPublicKey),
                new VanillaObligation(PROGRAM_ID),
                1_000_000,
                true
            );

            console.log(withdrawAction.setupIxs, 'withdrawAction.setupIxs');
            console.log(withdrawAction.lendingIxs, 'withdrawAction.lendingIxs');
            console.log(withdrawAction.cleanupIxs, 'withdrawAction.cleanupIxs');

            let instructionsData = [];
            if (withdrawAction.setupIxs.length) {
                for (let i = 0, len = withdrawAction.setupIxs.length; i < len; ++i) {
                    instructionsData.push(config.utils.prepareInstruction(withdrawAction.setupIxs[i]));
                }
            }

            if (withdrawAction.lendingIxs.length) {
                for (let i = 0, len = withdrawAction.lendingIxs.length; i < len; ++i) {
                    instructionsData.push(config.utils.prepareInstruction(withdrawAction.lendingIxs[i]));
                }
            }

            if (withdrawAction.cleanupIxs.length) {
                for (let i = 0, len = withdrawAction.cleanupIxs.length; i < len; ++i) {
                    instructionsData.push(config.utils.prepareInstruction(withdrawAction.cleanupIxs[i]));
                }
            }

            // add following instruction to instructionsData - transfer from contract's USDC ATA to contract's USDC arbitrary account
            instructionsData.push(
                createTransferInstruction(
                    countract_cUSD_AYA,
                    config.utils.calculateTokenAccount(
                        config.DATA.EVM.ADDRESSES.USDC,
                        ERC4626Raydium.address,
                        new web3.PublicKey(config.DATA.SVM.ADDRESSES.NEON_PROGRAM)
                    ),
                    new web3.PublicKey(contractPublicKey),
                    123, // FIX AMOUNT
                    []
                )
            );

            tx = await ERC4626Raydium.connect(operator).withdrawFromSolana(
                depositAmountToSolana,
                instructionsData
            );
            await tx.wait(1);
            console.log(tx, 'tx done');

            expect(userMaxWithdraw).to.eq(await ERC4626Raydium.maxWithdraw(user.address));
            console.log(totalAssets, 'totalAssets');
            console.log(await ERC4626Raydium.totalAssets(), 'await ERC4626Raydium.totalAssets()');
        });

        it('Test user withdraw from protocol', async function () {
            const totalAssets = await ERC4626Raydium.totalAssets();
            const userBalance = await WSOL.balanceOf(user.address);
            const userSharesBalance = await ERC4626Raydium.balanceOf(user.address);

            tx = await ERC4626Raydium.connect(user).redeem(userSharesBalance, user.address, user.address);
            await tx.wait(1);
            console.log(tx, 'redeem tx');

            expect(totalAssets).to.be.greaterThan(await ERC4626Raydium.totalAssets());
            expect(await WSOL.balanceOf(user.address)).to.be.greaterThan(userBalance);
            expect(userSharesBalance).to.be.greaterThan(await ERC4626Raydium.balanceOf(user.address));
        }); */
    });
});