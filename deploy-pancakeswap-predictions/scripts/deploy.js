// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();
    console.log(owner, 'owner');
    const PancakePredictionV2 = await ethers.deployContract('PancakePredictionV2', [
        '0x7235B04963600fA184f6023696870F49d014416d',
        owner.address,
        owner.address,
        300,
        299,
        '1000000000000000',
        300,
        1000
    ]);
    await PancakePredictionV2.waitForDeployment();

    console.log(
        `PancakePredictionV2 token deployed to ${PancakePredictionV2.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});