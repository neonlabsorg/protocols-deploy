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
    const TakerContract = await ethers.deployContract('TakerContract', [
        '0xF40dd8107EEc3397Ab227cA67a536436e0bd80C8' // LimitOrderProtocol
    ]);
    await TakerContract.waitForDeployment();

    console.log(
        `TakerContract token deployed to ${TakerContract.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});