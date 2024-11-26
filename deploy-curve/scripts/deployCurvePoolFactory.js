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
    
    const CurvePoolFactoryA = await ethers.deployContract('CurvePoolFactory', [
        '0xC53e083996A14B73f6577C953f1ac03398F3ABAc' // devnet CurveStableswapFactoryNG
    ]);
    await CurvePoolFactoryA.waitForDeployment();
    console.log(
        `CurvePoolFactoryA token deployed to ${CurvePoolFactoryA.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});