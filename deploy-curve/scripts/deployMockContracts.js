// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const { config } = require("./config");

async function main() {
    if (!ethers.isAddress(config.DATA.EVM.ADDRESSES.TokenA) || !ethers.isAddress(config.DATA.EVM.ADDRESSES.TokenB)) {
        console.log('Invalid erc20fospl tokens addresses');
        return false;
    }
    
    const MockCurve = await ethers.deployContract('MockCurve', [
        config.DATA.EVM.ADDRESSES.TokenA,
        config.DATA.EVM.ADDRESSES.TokenB
    ]);
    await MockCurve.waitForDeployment();
    console.log(
        `MockCurve token deployed to ${MockCurve.target}`
    );
    
    const TestContract = await ethers.deployContract('TestContract', [
        MockCurve.target,
        config.DATA.EVM.ADDRESSES.TokenA,
        config.DATA.EVM.ADDRESSES.TokenB
    ]);
    await TestContract.waitForDeployment();
    console.log(
        `TestContract token deployed to ${TestContract.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});