const { ethers } = require("hardhat");
const { expect } = require("chai");
const { config } = require("../scripts/config");
require("dotenv").config();

describe('TestCurvePoolFactory tests:', async function () {
    let owner, user;
    let CurvePoolFactory;
    let CurveStableswapFactoryNG;

    if (!ethers.isAddress(config.DATA.EVM.ADDRESSES.TokenA) || !ethers.isAddress(config.DATA.EVM.ADDRESSES.TokenB)) {
        console.log('Invalid erc20fospl tokens addresses');
        return false;
    }

    before(async function() {
        [owner, user] = await ethers.getSigners();

        CurvePoolFactory = await ethers.getContractAt('CurvePoolFactory', '0x7D39D1F44E965cdfC0e93F0D35E2f2a1b5148b71');
        CurveStableswapFactoryNG = await ethers.getContractAt('contracts/interfaces/ICurveStableswapFactoryNG.sol:ICurveStableswapFactoryNG', '0xC53e083996A14B73f6577C953f1ac03398F3ABAc');
        
        console.log(await CurveStableswapFactoryNG.admin(), 'admin');
    });

    describe('Tests:', function() {
        it('Deploy plain pool', async function () {
            let tx = await CurvePoolFactory.deploy(
                "USDT/USDC",
                "usdt-usdt",
                [
                    "0x6eEf939FC6e2B3F440dCbB72Ea81Cd63B5a519A5", // USDT
                    "0x512E48836Cd42F3eB6f50CEd9ffD81E0a7F15103"  // USDC
                ],
                1500,
                1000000,
                20000000000,
                865,
                0,
                [0, 0],
                ["0x00000000", "0x00000000"],
                ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"]
            );
            console.log(tx, 'tx');
            
            let receipt = await tx.wait(1);
            console.log(receipt, 'receipt');
        });
    });
});