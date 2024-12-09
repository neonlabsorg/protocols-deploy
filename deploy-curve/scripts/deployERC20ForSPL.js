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
    
    const ERC20ForSplMintableA = await ethers.deployContract('ERC20ForSplMintable', [
        'TokenA',
        'TA',
        9,
        owner.address
    ]);
    await ERC20ForSplMintableA.waitForDeployment();
    console.log(
        `ERC20ForSplMintableA token deployed to ${ERC20ForSplMintableA.target}`
    );
    console.log(await ERC20ForSplMintableA.tokenMint(), 'tokenMint');
    console.log(await ERC20ForSplMintableA.findMintAccount(), 'findMintAccount');

    return;
    
    const ERC20ForSplMintableB = await ethers.deployContract('ERC20ForSplMintable', [
        'TokenB',
        'TB',
        9,
        owner.address
    ]);
    await ERC20ForSplMintableB.waitForDeployment();
    console.log(
        `ERC20ForSplMintableB token deployed to ${ERC20ForSplMintableB.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});