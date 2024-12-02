// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const { config } = require('../test/config');

async function main() {
    const ERC4626Kamino = await ethers.deployContract('ERC4626Kamino', [
        config.DATA.EVM.ADDRESSES.USDC
    ]);
    await ERC4626Kamino.waitForDeployment();
    console.log(
        `ERC4626Kamino token deployed to ${ERC4626Kamino.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});