// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const { config } = require('../test/config');
const web3 = require("@solana/web3.js");
const {
    KaminoAction,
    PROGRAM_ID,
    VanillaObligation,
    KaminoMarket,
    DEFAULT_RECENT_SLOT_DURATION_MS
} = require('@kamino-finance/klend-sdk');
const bs58 = require('bs58');
const BN = require('bn.js');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [operator, user] = await ethers.getSigners();
    const depositAmount = 1000;
    const bufferAmount = 20; // percentage
    
    const ERC4626Kamino1 = await ethers.deployContract('ERC4626Raydium', [
        config.DATA.EVM.ADDRESSES.WSOL
    ]);
    await ERC4626Kamino1.waitForDeployment();
    console.log(
        `ERC4626Raydium token deployed to ${ERC4626Kamino1.target}`
    );

    return;

    const ERC4626KaminoAddress = '0xA1049D1175c7CC68B08d1ff4c7A0c977dbc05aF8';
    const ERC4626Kamino = await ethers.getContractAt('ERC4626Kamino', ERC4626KaminoAddress);

    const USDC = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.USDC);

    const contractPublicKeyInBytes = await ERC4626Kamino.getNeonAddress(ERC4626KaminoAddress);
    contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    /* let tx = await USDC.connect(user).approve(ERC4626KaminoAddress, depositAmount);
    await tx.wait(1);
    console.log(tx, 'approve tx');

    tx = await ERC4626Kamino.connect(user).deposit(depositAmount, user.address);
    await tx.wait(1);
    console.log(tx, 'deposit tx'); */

    const depositAmountToSolana = parseInt((parseInt(await ERC4626Kamino.totalAssets()) * (100 - bufferAmount)) / 100);
    console.log(depositAmountToSolana, 'depositAmountToSolana');
    console.log(new BN(depositAmountToSolana), 'new BN(depositAmountToSolana)');
    
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
        1_000_000,
        false
    );

    console.log(depositAction.setupIxs, 'depositAction.setupIxs');
    console.log(depositAction.lendingIxs, 'depositAction.lendingIxs');
    console.log(depositAction.cleanupIxs, 'depositAction.cleanupIxs');

    let instructionsData = [];
    if (depositAction.setupIxs.length) {
        for (let i = 0, len = depositAction.setupIxs.length; i < len; ++i) {
            instructionsData.push(config.utils.prepareInstruction(depositAction.setupIxs[i]));
        }
    }

    if (depositAction.lendingIxs.length) {
        console.log(depositAction.lendingIxs[0].keys, 'keys');
        for (let i = 0, len = depositAction.lendingIxs.length; i < len; ++i) {
            /* for (let y = 0, leny = depositAction.lendingIxs[i].keys.length; y < leny - 1; ++y) {;
                await timeout(1000);
                console.log(await isAccountRentExempt(connection, depositAction.lendingIxs[i].keys[y].pubkey), depositAction.lendingIxs[i].keys[y].pubkey);
            } */
            instructionsData.push(config.utils.prepareInstruction(depositAction.lendingIxs[i]));
        }
    }

    if (depositAction.cleanupIxs.length) {
        for (let i = 0, len = depositAction.cleanupIxs.length; i < len; ++i) {
            instructionsData.push(config.utils.prepareInstruction(depositAction.cleanupIxs[i]));
        }
    }
    console.log(instructionsData, 'instructionsData');

    /* tx = await ERC4626Kamino.connect(operator).depositToSolana(
        depositAmountToSolana,
        [],
        []
    );
    await tx.wait(1);
    console.log(tx, 'tx done'); */

    tx = await ERC4626Kamino.connect(operator).executeComposabilityRequest(
        [0],
        [instructionsData[0]]
    );
    await tx.wait(1);
    console.log(tx, 'tx done'); 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});