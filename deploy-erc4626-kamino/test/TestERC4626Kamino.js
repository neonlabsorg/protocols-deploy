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
const RECEIPTS_COUNT = 50;

describe('TestERC4626Kamino tests:', async function () {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const ERC4626KaminoAddress = '0xaD162799C30c7D915b047013Ad2C3A84DEB20c72';
    let operator, user;
    let ERC4626Kamino;
    let contractPublicKey;
    let USDC;
    const depositAmount = 10000;
    const withdrawAmount = 100; // percentage
    const bufferAmount = 20; // percentage
    if (!ethers.isAddress(ERC4626KaminoAddress)) {
        console.log('Invalid ERC4626KaminoAddress');
        process.exit();
    }

    before(async function() {
        [operator, user] = await ethers.getSigners();

        ERC4626Kamino = await ethers.getContractAt('ERC4626Kamino', ERC4626KaminoAddress);
        USDC = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.USDC);

        const contractPublicKeyInBytes = await ERC4626Kamino.getNeonAddress(ERC4626KaminoAddress);
        contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
        console.log(contractPublicKey, 'contractPublicKey');
        console.log(await ERC4626Kamino.asset(), 'asset()');

        const cUSDC_ATA = await getAssociatedTokenAddressSync(
            new web3.PublicKey(config.DATA.SVM.ADDRESSES.KAMINO_RESERVE_USDC),
            new web3.PublicKey(contractPublicKey), 
            true, 
            TOKEN_PROGRAM_ID, 
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const cUSDC_ATAInfo = await connection.getAccountInfo(cUSDC_ATA);
    
        const USDC_ATA = await getAssociatedTokenAddressSync(
            new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC),
            new web3.PublicKey(contractPublicKey), 
            true, 
            TOKEN_PROGRAM_ID, 
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const USDC_ATAInfo = await connection.getAccountInfo(USDC_ATA);
    
        // in order to proceed with swap the executor account needs to have existing Token Accounts for both tokens
        if (!cUSDC_ATAInfo || !USDC_ATAInfo) {
            if (!cUSDC_ATAInfo) {
                console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + config.DATA.SVM.ADDRESSES.KAMINO_RESERVE_USDC + ' ).');
            }
            if (!USDC_ATAInfo) {
                console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenB ( ' + config.DATA.SVM.ADDRESSES.USDC + ' ).');
            }
            process.exit();
        }
    });

    describe('Tests:', function() {
        it('Test user deposit into protocol', async function () {
            const totalAssets = await ERC4626Kamino.totalAssets();
            const userBalance = await USDC.balanceOf(user.address);
            const userSharesBalance = await ERC4626Kamino.balanceOf(user.address);

            let tx;
            tx = await USDC.connect(user).approve(ERC4626KaminoAddress, depositAmount);
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx, 'approve tx');

            tx = await ERC4626Kamino.connect(user).deposit(depositAmount, user.address);
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx, 'deposit tx');

            expect(await ERC4626Kamino.totalAssets()).to.be.greaterThan(totalAssets);
            expect(userBalance).to.be.greaterThan(await USDC.balanceOf(user.address));
            expect(await ERC4626Kamino.balanceOf(user.address)).to.be.greaterThan(userSharesBalance);
        });

        it('Test operator deposit to Solana', async function () {
            const protocolUSDCBalance = await USDC.balanceOf(ERC4626Kamino.target);
            const userSharesBalance = await ERC4626Kamino.balanceOf(user.address);

            const depositAmountToSolana = parseInt((Number(protocolUSDCBalance) * (100 - bufferAmount)) / 100);
            console.log(depositAmountToSolana, 'depositAmountToSolana');
            
            /* const { market, reserve: usdcReserve } = await config.kaminoHelper.loadReserveData({
                connection,
                marketPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.KAMINO_MAIN_MARKET),
                mintPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC),
                KaminoMarket: KaminoMarket,
                DEFAULT_RECENT_SLOT_DURATION_MS: DEFAULT_RECENT_SLOT_DURATION_MS
            }); */

            const market = await config.kaminoHelper.getMarket({ connection, marketPubkey: new web3.PublicKey(config.DATA.SVM.ADDRESSES.KAMINO_MAIN_MARKET), KaminoMarket, DEFAULT_RECENT_SLOT_DURATION_MS: DEFAULT_RECENT_SLOT_DURATION_MS });

            const depositAction = await KaminoAction.buildDepositReserveLiquidityTxns(
                market,
                new BN(depositAmountToSolana),
                new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC), //usdcReserve.getLiquidityMint(),
                new web3.PublicKey(contractPublicKey),
                new VanillaObligation(PROGRAM_ID),
                0,
                false
            );

            let instructionsData = [];
            if (depositAction.lendingIxs.length) {
                for (let i = 0, len = depositAction.lendingIxs.length; i < len; ++i) {
                    console.log(depositAction.lendingIxs[i].keys, 'keys');
                    instructionsData.push(config.utils.prepareInstruction(depositAction.lendingIxs[i]));
                }
            }

            let tx = await ERC4626Kamino.connect(operator).depositToSolana(
                depositAmountToSolana,
                instructionsData[0]
            );
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx, 'tx done');

            expect(userSharesBalance).to.eq(await ERC4626Kamino.balanceOf(user.address));
            expect(protocolUSDCBalance).to.be.greaterThan(await USDC.balanceOf(ERC4626Kamino.target));
        });

        it('Test operator withdraw from Solana', async function () {
            const protocolUSDCBalance = await USDC.balanceOf(ERC4626Kamino.target);
            const userSharesBalance = await ERC4626Kamino.balanceOf(user.address);

            const countract_USD_ATA = getAssociatedTokenAddressSync(
                new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC), 
                new web3.PublicKey(contractPublicKey), 
                true, 
                TOKEN_PROGRAM_ID, 
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            console.log(countract_USD_ATA, 'countract_USD_ATA');

            const countract_cUSD_ATA = getAssociatedTokenAddressSync(
                new web3.PublicKey(config.DATA.SVM.ADDRESSES.KAMINO_RESERVE_USDC), 
                new web3.PublicKey(contractPublicKey), 
                true, 
                TOKEN_PROGRAM_ID, 
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            const kUSDCTokenAmount = await connection.getTokenAccountBalance(countract_cUSD_ATA);

            let withdrawAmountFromSolana; 
            if (withdrawAmount == 100) {
                withdrawAmountFromSolana = kUSDCTokenAmount.value.amount;
            } else {
                withdrawAmountFromSolana = (kUSDCTokenAmount.value.amount * withdrawAmount) / 100;
            }
            console.log(withdrawAmountFromSolana, 'withdrawAmountFromSolana');

            const getKaminoUSDCcUSDCExchangeRate = await ERC4626Kamino.getKaminoUSDCcUSDCExchangeRate();
            console.log(getKaminoUSDCcUSDCExchangeRate, 'getKaminoUSDCcUSDCExchangeRate');

            const exchange = withdrawAmountFromSolana / (Number(getKaminoUSDCcUSDCExchangeRate[0]) / Number(getKaminoUSDCcUSDCExchangeRate[1]));
            console.log(exchange, 'exchange');
            
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
                new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC), //usdcReserve.getLiquidityMint(),
                new web3.PublicKey(contractPublicKey),
                new VanillaObligation(PROGRAM_ID),
                0,
                false
            );

            let instructionsData = [];
            if (withdrawAction.lendingIxs.length) {
                for (let i = 0, len = withdrawAction.lendingIxs.length; i < len; ++i) {
                    instructionsData.push(config.utils.prepareInstruction(withdrawAction.lendingIxs[i]));
                }
            }

            // transfer from contract's USDC ATA to contract's USDC arbitrary account
            instructionsData.push(
                config.utils.prepareInstruction(
                    createTransferInstruction(
                        countract_USD_ATA,
                        config.utils.calculateTokenAccount(
                            config.DATA.EVM.ADDRESSES.USDC,
                            ERC4626Kamino.target,
                            new web3.PublicKey(config.DATA.SVM.ADDRESSES.NEON_PROGRAM)
                        )[0],
                        new web3.PublicKey(contractPublicKey),
                        parseInt((exchange * 99) / 100) // fix rounding issues
                    )
                )
            );

            let tx = await ERC4626Kamino.connect(operator).withdrawFromSolana(
                instructionsData
            );
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx, 'tx done');

            expect(userSharesBalance).to.eq(await ERC4626Kamino.balanceOf(user.address));
            expect(await USDC.balanceOf(ERC4626Kamino.target)).to.be.greaterThan(protocolUSDCBalance);
        });

        it('Test user withdraw from protocol', async function () {
            const totalAssets = await ERC4626Kamino.totalAssets();
            const userBalance = await USDC.balanceOf(user.address);
            const userSharesBalance = await ERC4626Kamino.balanceOf(user.address);

            tx = await ERC4626Kamino.connect(user).redeem(userSharesBalance, user.address, user.address);
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx, 'redeem tx');

            expect(totalAssets).to.be.greaterThan(await ERC4626Kamino.totalAssets());
            expect(await USDC.balanceOf(user.address)).to.be.greaterThan(userBalance);
            expect(userSharesBalance).to.be.greaterThan(await ERC4626Kamino.balanceOf(user.address));
        });
    });
});