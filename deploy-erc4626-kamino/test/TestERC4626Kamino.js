const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const {
    KaminoAction,
    PROGRAM_ID,
    VanillaObligation,
    KaminoMarket,
    DEFAULT_RECENT_SLOT_DURATION_MS
} = require('@kamino-finance/klend-sdk');
const {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createTransferInstruction
} = require("@solana/spl-token");
const BN = require('bn.js');
const { config } = require('./config');

describe('TestERC4626Kamino tests:', async function () {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const ERC4626KaminoAddress = '0x5Cd79e38a25bD0bdCaBA81b8e9a22db745a2700E';
    let operator, user;
    let ERC4626Kamino;
    let contractPublicKey;
    let USDC;
    const depositAmount = 1000;
    const withdrawAmount = 10; // percentage
    const bufferAmount = 15; // percentage
    if (!ethers.isAddress(ERC4626KaminoAddress)) {
        console.log('Invalid ERC4626KaminoAddress');
        return false;
    }

    before(async function() {
        [operator, user] = await ethers.getSigners();

        ERC4626Kamino = await ethers.getContractAt('ERC4626Kamino', ERC4626KaminoAddress);
        USDC = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.USDC);

        const contractPublicKeyInBytes = await ERC4626Kamino.getNeonAddress(ERC4626KaminoAddress);
        contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
        console.log(contractPublicKey, 'contractPublicKey');

        console.log(await ERC4626Kamino.asset(), 'asset()');
        console.log(await ERC4626Kamino.getKaminoUSDCcUSDCExchangeRate(), 'getKaminoUSDCcUSDCExchangeRate');
    });

    describe('Tests:', function() {
        /* it('Test user deposit into protocol', async function () {
            const totalAssets = await ERC4626Kamino.totalAssets();
            console.log(totalAssets, 'totalAssets');
            const userBalance = await USDC.balanceOf(user.address);
            console.log(userBalance, 'userBalance');
            const userSharesBalance = await ERC4626Kamino.balanceOf(user.address);
            console.log(userSharesBalance, 'userSharesBalance');

            let tx = await USDC.connect(user).approve(ERC4626KaminoAddress, depositAmount);
            await tx.wait(3);
            console.log(tx, 'approve tx');

            tx = await ERC4626Kamino.connect(user).deposit(depositAmount, user.address);
            await tx.wait(1);
            console.log(tx, 'deposit tx');

            expect(await ERC4626Kamino.totalAssets()).to.be.greaterThan(totalAssets);
            expect(userBalance).to.be.greaterThan(await USDC.balanceOf(user.address));
            expect(await ERC4626Kamino.balanceOf(user.address)).to.be.greaterThan(userSharesBalance);
        }); */

        it('Test operator deposit to Solana', async function () {
            const totalAssets = await ERC4626Kamino.totalAssets();
            console.log(totalAssets, 'totalAssets');
            const userBalance = await USDC.balanceOf(user.address);
            console.log(userBalance, 'userBalance');
            const userSharesBalance = await ERC4626Kamino.balanceOf(user.address);
            console.log(userSharesBalance, 'userSharesBalance');

            const userMaxWithdraw = await ERC4626Kamino.maxWithdraw(user.address);

            //const depositAmountToSolana = parseInt((parseInt(await ERC4626Kamino.totalAssets()) * (100 - bufferAmount)) / 100);
            //console.log(depositAmountToSolana, 'depositAmountToSolana');
            const depositAmountToSolana = 10000;
            
            const { market, reserve: usdcReserve } = await config.kaminoHelper.loadReserveData({
                connection,
                marketPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.KAMINO_MAIN_MARKET),
                mintPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC),
                KaminoMarket: KaminoMarket,
                DEFAULT_RECENT_SLOT_DURATION_MS: DEFAULT_RECENT_SLOT_DURATION_MS
            });

            const depositAction = await KaminoAction.buildDepositReserveLiquidityTxns(
                market,
                new BN(depositAmountToSolana),
                usdcReserve.getLiquidityMint(),
                new web3.PublicKey(contractPublicKey),
                new VanillaObligation(PROGRAM_ID),
                0,
                false
            );

            console.log(depositAction.setupIxs, 'depositAction.setupIxs');
            console.log(depositAction.lendingIxs, 'depositAction.lendingIxs');
            console.log(depositAction.cleanupIxs, 'depositAction.cleanupIxs');

            let instructionsData = [];
            if (depositAction.setupIxs.length) {
                for (let i = 0, len = depositAction.setupIxs.length; i < len; ++i) {
                    console.log(depositAction.setupIxs[i].keys, 'keys');
                    instructionsData.push(config.utils.prepareInstruction(depositAction.setupIxs[i]));
                }
            }

            if (depositAction.lendingIxs.length) {
                for (let i = 0, len = depositAction.lendingIxs.length; i < len; ++i) {
                    console.log(depositAction.lendingIxs[i].keys, 'keys');
                    instructionsData.push(config.utils.prepareInstruction(depositAction.lendingIxs[i]));
                }
            }

            /* if (depositAction.cleanupIxs.length) {
                for (let i = 0, len = depositAction.cleanupIxs.length; i < len; ++i) {
                    instructionsData.push(config.utils.prepareInstruction(depositAction.cleanupIxs[i]));
                }
            } */

            /* tx = await ERC4626Kamino.connect(operator).depositToSolana(
                depositAmountToSolana,
                [0],
                [instructionsData[0]]
            );
            await tx.wait(1);
            console.log(tx, 'tx done'); */

            console.log(instructionsData, 'executeComposabilityRequest');
            tx = await ERC4626Kamino.connect(operator).executeComposabilityRequest(
                [0],
                instructionsData
            );
            console.log(tx, 'tx');
            await tx.wait(1);
            console.log(tx, 'tx done'); 

            expect(userMaxWithdraw).to.eq(await ERC4626Kamino.maxWithdraw(user.address));
            console.log(totalAssets, 'totalAssets');
            console.log(await ERC4626Kamino.totalAssets(), 'await ERC4626Kamino.totalAssets()');
        });

        /* it('Test operator withdraw from Solana', async function () {
            console.log(await connection.getAccountInfo(ReceiverAccount), 'getAccountInfo SenderAccount');
            const userMaxWithdraw = await ERC4626Kamino.maxWithdraw(user.address);
            const totalAssets = await ERC4626Kamino.totalAssets();

            const countract_cUSD_AYA = getAssociatedTokenAddressSync(
                new web3.PublicKey(config.DATA.SVM.ADDRESSES.KAMINO_RESERVE_USDC), 
                new web3.PublicKey(contractPublicKey), 
                true, 
                TOKEN_PROGRAM_ID, 
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            const kUSDCTokenAmount = await connection.getTokenAccountBalance(countract_cUSD_AYA);
            console.log(kUSDCTokenAmount, 'kUSDCTokenAmount');

            const withdrawAmountFromSolana = parseInt((kUSDCTokenAmount.value.amount * withdrawAmount) / 100);
            console.log(withdrawAmountFromSolana, 'withdrawAmountFromSolana');
            
            const { market, reserve: usdcReserve } = await config.kaminoHelper.loadReserveData({
                connection,
                marketPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.KAMINO_MAIN_MARKET),
                mintPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC),
                KaminoMarket: KaminoMarket,
                DEFAULT_RECENT_SLOT_DURATION_MS: DEFAULT_RECENT_SLOT_DURATION_MS
            });
            const withdrawAction = await KaminoAction.buildRedeemReserveCollateralTxns(
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
                        ERC4626Kamino.address,
                        new web3.PublicKey(config.DATA.SVM.ADDRESSES.NEON_PROGRAM)
                    ),
                    new web3.PublicKey(contractPublicKey),
                    123, // FIX AMOUNT
                    []
                )
            );

            tx = await ERC4626Kamino.connect(operator).withdrawFromSolana(
                depositAmountToSolana,
                instructionsData
            );
            await tx.wait(1);
            console.log(tx, 'tx done');

            expect(userMaxWithdraw).to.eq(await ERC4626Kamino.maxWithdraw(user.address));
            console.log(totalAssets, 'totalAssets');
            console.log(await ERC4626Kamino.totalAssets(), 'await ERC4626Kamino.totalAssets()');
        });

        it('Test user withdraw from protocol', async function () {
            const totalAssets = await ERC4626Kamino.totalAssets();
            const userBalance = await USDC.balanceOf(user.address);
            const userSharesBalance = await ERC4626Kamino.balanceOf(user.address);

            tx = await ERC4626Kamino.connect(user).redeem(userSharesBalance, user.address, user.address);
            await tx.wait(1);
            console.log(tx, 'redeem tx');

            expect(totalAssets).to.be.greaterThan(await ERC4626Kamino.totalAssets());
            expect(await USDC.balanceOf(user.address)).to.be.greaterThan(userBalance);
            expect(userSharesBalance).to.be.greaterThan(await ERC4626Kamino.balanceOf(user.address));
        }); */
    });
});

// TxHash,BlockNumber,UnixTimestamp,FromAddress,ToAddress,ContractAddress,Type,Value,Fee,Status,ErrCode,CurrentPrice,TxDateOpeningPrice,TxDateClosingPrice,MethodName
