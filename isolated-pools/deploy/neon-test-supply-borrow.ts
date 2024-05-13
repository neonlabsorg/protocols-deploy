import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, network } from "hardhat";
import { convertToUnit, scaleDownBy } from "../helpers/utils";
import chai from "chai";
const { expect } = chai;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const [deployer, user] = await ethers.getSigners();
    const VToken = await ethers.getContractFactory("VToken");

    // Define Mock tokens intances
    const MockWETH = await ethers.getContract("MockWETH");
    const MockUSDT = await ethers.getContract("MockUSDT");
  
    // Define vWETH instance
    const VToken_vWETH_Core = await ethers.getContract("VToken_vWETH_Core");
    const VToken_vWETH_Core_Instance = VToken.attach(VToken_vWETH_Core.address);
  
    // Define vUSDT instance
    const VToken_vUSDT_Core = await ethers.getContract("VToken_vUSDT_Core");
    const VToken_vUSDT_Core_Instance = VToken.attach(VToken_vUSDT_Core.address);

    const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
    const Comptroller_Core = await ethers.getContract("Comptroller_Core");
    const Comptroller_CoreInstance = ComptrollerFactory.attach(Comptroller_Core.address);

    let tx = await Comptroller_CoreInstance.connect(deployer).enterMarkets([VToken_vWETH_Core_Instance.address, VToken_vUSDT_Core_Instance.address]);
    await tx.wait(3);
    tx = await Comptroller_CoreInstance.connect(user).enterMarkets([VToken_vWETH_Core_Instance.address, VToken_vUSDT_Core_Instance.address]);
    await tx.wait(3);

    // Set supply caps
    tx = await Comptroller_CoreInstance.setMarketSupplyCaps([VToken_vWETH_Core_Instance.address, VToken_vUSDT_Core_Instance.address], ['10000000000000000000000000000000000000000000000000', '10000000000000000000000000000000000000000000000000']);
    await tx.wait(3);
  
    // Set borrow caps
    tx = await Comptroller_CoreInstance.setMarketBorrowCaps([VToken_vWETH_Core_Instance.address, VToken_vUSDT_Core_Instance.address], ['10000000000000000000000000000000000000000000000000', '10000000000000000000000000000000000000000000000000']);
    await tx.wait(3);

    // Mint tokens
    const initialWETHBalance = await MockWETH.balanceOf(deployer.address);
    tx = await MockWETH.faucet('1000000000000000000000');
    await tx.wait(3);

    expect(await MockWETH.balanceOf(deployer.address)).to.be.greaterThan(initialWETHBalance);
    console.log('Mint of WETH to deployer successful - ', tx.hash);

    const initialUSDTBalance = await MockUSDT.balanceOf(user.address);
    tx = await MockUSDT.connect(user).faucet('1000000000000000000000000');
    await tx.wait(3);

    expect(await MockUSDT.balanceOf(user.address)).to.be.greaterThan(initialUSDTBalance);
    console.log('Mint of USDT to user successful - ', tx.hash);

    // Supply tokens from deployer ( WETH => vWETH )
    tx = await MockWETH.approve(VToken_vWETH_Core_Instance.address, await MockWETH.balanceOf(deployer.address));
    await tx.wait(3);

    const initialvWETHBalance = await VToken_vWETH_Core_Instance.balanceOf(deployer.address);
    const initialAccountSnapshot = await VToken_vWETH_Core_Instance.getAccountSnapshot(deployer.address);
    const initialPoolfCash = await VToken_vWETH_Core_Instance.getCash();
    const initialBorrowingPower = await Comptroller_CoreInstance.connect(deployer).getBorrowingPower(deployer.address);
    tx = await VToken_vWETH_Core_Instance.connect(deployer).mint('10000000000000000');
    await tx.wait(3);

    expect(await VToken_vWETH_Core_Instance.balanceOf(deployer.address)).to.be.greaterThan(initialvWETHBalance);
    expect((await VToken_vWETH_Core_Instance.getAccountSnapshot(deployer.address)).vTokenBalance).to.be.greaterThan(initialAccountSnapshot.vTokenBalance);
    expect(await VToken_vWETH_Core_Instance.getCash()).to.be.greaterThan(initialPoolfCash);
    expect((await Comptroller_CoreInstance.connect(deployer).getBorrowingPower(deployer.address)).liquidity).to.be.greaterThan(initialBorrowingPower.liquidity);
    console.log('Deployer WETH supply successful - ', tx.hash);

    // Supply tokens from user ( USDT => vUSDT )
    tx = await MockUSDT.connect(user).approve(VToken_vUSDT_Core_Instance.address, await MockUSDT.balanceOf(user.address));
    await tx.wait(3);

    const initialvUSDTBalance = await VToken_vUSDT_Core_Instance.balanceOf(user.address);
    const initialvUSDTAccountSnapshot = await VToken_vUSDT_Core_Instance.getAccountSnapshot(user.address);
    const initialPoolvUSDTfCash = await VToken_vUSDT_Core_Instance.getCash();
    tx = await VToken_vUSDT_Core_Instance.connect(user).mint('1000000000000000000000');
    await tx.wait(3);

    expect(await VToken_vUSDT_Core_Instance.balanceOf(user.address)).to.be.greaterThan(initialvUSDTBalance);
    expect((await VToken_vUSDT_Core_Instance.getAccountSnapshot(user.address)).vTokenBalance).to.be.greaterThan(initialvUSDTAccountSnapshot.vTokenBalance);
    expect(await VToken_vUSDT_Core_Instance.getCash()).to.be.greaterThan(initialPoolvUSDTfCash);
    console.log('User USDT supply successful - ', tx.hash);

    // Borrow WETH from user
    const initialUserWETHBalance = await MockWETH.balanceOf(user.address);
    const initialUserBorrowingPower = await Comptroller_CoreInstance.connect(user).getBorrowingPower(user.address);
    tx = await VToken_vWETH_Core_Instance.connect(user).borrow('10000000000000000');
    await tx.wait(3);

    expect(await MockWETH.balanceOf(user.address)).to.be.greaterThan(initialUserWETHBalance);
    expect(initialUserBorrowingPower.liquidity).to.be.greaterThan((await Comptroller_CoreInstance.connect(user).getBorrowingPower(user.address)).liquidity);
    console.log('User WETH borrow successful - ', tx.hash);

    // Repay WETH from user
    const repayAmount = '5000000000000000';
    tx = await MockWETH.connect(user).approve(VToken_vWETH_Core_Instance.address, repayAmount);
    await tx.wait(3);
    
    const initialUserWETHBalance1 = await MockWETH.balanceOf(user.address);
    const initialUserBorrowingPower1 = await Comptroller_CoreInstance.connect(user).getBorrowingPower(user.address);
    tx = await VToken_vWETH_Core_Instance.connect(user).repayBorrow(repayAmount);
    await tx.wait(3);

    expect(initialUserWETHBalance1).to.be.greaterThan(await MockWETH.balanceOf(user.address));
    expect((await Comptroller_CoreInstance.connect(user).getBorrowingPower(user.address)).liquidity).to.be.greaterThan(initialUserBorrowingPower1.liquidity);
    console.log('User WETH repay successful - ', tx.hash);
};

func.tags = ["NeonTestSupplyBorrow"];

export default func;