const { ethers } = require("hardhat");
const { expect } = require("chai");

function timeout(ms) {
    console.log('timeout promise ' + ms + 'ms ...');
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('PancakeSwap predictions tests:', async function () {
    let owner, user;
    const WSOLAddress = '0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c';
    const CHAINLINK_WSOL_USDC_PRICE_FEED = '0xec852B2A009f49E4eE4ffEddeDcF81a1AD1bbD6d';
    let WSOL;
    let PancakePredictionV3;
    let tx;
    let currentEpoch;
    const bullBetAmount = 1000;
    const bearBetAmount = 5000;

    before(async function() {
        // owner is bull, user is bear
        [owner, user] = await ethers.getSigners();

        WSOL = await ethers.getContractAt('contracts/IERC20ForSPL.sol:IERC20ForSPL', WSOLAddress);
        if (await WSOL.balanceOf(owner.address) < bullBetAmount) {
            throw new Error('Bull doesn\'t have enough WSOL balance.');
        }
        if (await WSOL.balanceOf(user.address) < bearBetAmount) {
            throw new Error('Bear doesn\'t have enough WSOL balance.');
        }

        PancakePredictionV3 = await ethers.deployContract('PancakePredictionV3', [
            WSOLAddress,
            CHAINLINK_WSOL_USDC_PRICE_FEED, 
            owner.address,
            owner.address,
            60,
            59,
            1000,
            300,
            1000
        ]);
        await PancakePredictionV3.waitForDeployment();
        console.log(
            `PancakePredictionV3 token deployed to ${PancakePredictionV3.target}`
        );

        // users provide approvals to the protocol
        tx = await WSOL.connect(owner).approve(PancakePredictionV3.target, bullBetAmount);
        await tx.wait(1);
        console.log(tx.hash, 'BULL approve');

        tx = await WSOL.connect(user).approve(PancakePredictionV3.target, bearBetAmount);
        await tx.wait(1);
        console.log(tx.hash, 'BEAR approve');

        console.log(await PancakePredictionV3.currentEpoch(), 'currentEpoch');

        tx = await PancakePredictionV3.connect(owner).genesisStartRound();
        await tx.wait(1);
        console.log(tx.hash, 'genesisStartRound');

        currentEpoch = await PancakePredictionV3.currentEpoch();
        console.log(currentEpoch, 'currentEpoch');
    });

    describe('Tests:', function() {
        it('Test betting', async function () {
            await timeout(60000);

            tx = await PancakePredictionV3.connect(owner).genesisLockRound();
            await tx.wait(1);
            console.log(tx.hash, 'genesisLockRound');
            expect(await PancakePredictionV3.currentEpoch()).to.be.greaterThan(currentEpoch);

            currentEpoch = await PancakePredictionV3.currentEpoch();
            console.log(currentEpoch, 'currentEpoch');

            tx = await PancakePredictionV3.connect(owner).betBull(currentEpoch, bullBetAmount);
            await tx.wait(1);
            console.log(tx.hash, 'betBull');

            tx = await PancakePredictionV3.connect(user).betBear(currentEpoch, bearBetAmount);
            await tx.wait(1);
            console.log(tx.hash, 'betBear');

            await timeout(60000);
            tx = await PancakePredictionV3.connect(owner).executeRound();
            await tx.wait(1);
            console.log(tx.hash, 'executeRound');

            expect(await PancakePredictionV3.currentEpoch()).to.be.greaterThan(currentEpoch);
            currentEpoch = await PancakePredictionV3.currentEpoch();
            console.log(currentEpoch, 'currentEpoch');

            await timeout(60000);
            tx = await PancakePredictionV3.connect(owner).executeRound();
            await tx.wait(1);
            console.log(tx.hash, 'executeRound');

            expect(await PancakePredictionV3.currentEpoch()).to.be.greaterThan(currentEpoch);
            currentEpoch = await PancakePredictionV3.currentEpoch();
            console.log(currentEpoch, 'currentEpoch');

            const claimableBull = await PancakePredictionV3.claimable(parseInt(currentEpoch) - 2, owner.address);
            console.log(claimableBull, 'claimableBull');
            const claimableBear = await PancakePredictionV3.claimable(parseInt(currentEpoch) - 2, user.address);
            console.log(claimableBear, 'claimableBear');

            if (claimableBull) {
                tx = await PancakePredictionV3.connect(owner).claim([parseInt(currentEpoch) - 2]);
                await tx.wait(1);
                console.log(tx.hash, 'BULL claim');
            } else if (claimableBear) {
                tx = await PancakePredictionV3.connect(user).claim([parseInt(currentEpoch) - 2]);
                await tx.wait(1);
                console.log(tx.hash, 'BEAR claim');
            }
        });
    });
});