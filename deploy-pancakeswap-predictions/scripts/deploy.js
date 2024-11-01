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
    const PancakePredictionV3 = await ethers.deployContract('PancakePredictionV3', [
        '0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c', // WSOL
        '0xec852B2A009f49E4eE4ffEddeDcF81a1AD1bbD6d', // CHAINLINK SOL/ USD
        owner.address,
        owner.address,
        60,
        59,
        10000,
        300,
        1000
    ]);
    await PancakePredictionV3.waitForDeployment();

    console.log(
        `PancakePredictionV3 token deployed to ${PancakePredictionV3.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});