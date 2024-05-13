import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, network } from "hardhat";
import { parseUnits } from "ethers/lib/utils";
import { address as MockUSDTAddress } from "../deployments/neondevnet/MockUSDT.json";
import { address as MockBTCAddress } from "../deployments/neondevnet/MockWBTC.json";
import { address as MockWETHAddress } from "../deployments/neondevnet/MockWETH.json";

import {
  MockPriceOracle__factory
} from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const MockPriceOracle = await ethers.getContractFactory<MockPriceOracle__factory>("MockPriceOracle");
    let priceOracle = await MockPriceOracle.deploy();

    console.log(priceOracle.address, 'priceOracle.address');

    const usdtPrice = "0.99";
    const wbtcPrice = "65000";
    const wethPrice = "3000";
    
    let tx = await priceOracle.setPrice(MockUSDTAddress, parseUnits(usdtPrice, 18));
    await tx.wait(3);
    console.log(await priceOracle.getPrice(MockUSDTAddress), 'getPrice');

    tx = await priceOracle.setPrice(MockBTCAddress, parseUnits(wbtcPrice, 8));
    await tx.wait(3);
    console.log(await priceOracle.getPrice(MockBTCAddress), 'getPrice');

    tx = await priceOracle.setPrice(MockWETHAddress, parseUnits(wethPrice, 18));
    await tx.wait(3);
    console.log(await priceOracle.getPrice(MockWETHAddress), 'getPrice');
};

func.tags = ["NeonDeployPriceOracle"];

export default func;