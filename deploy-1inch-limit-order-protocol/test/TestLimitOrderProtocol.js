const { ethers } = require("hardhat");
const { expect } = require("chai");
const { fillWithMakingAmount, unwrapWethTaker, buildMakerTraits, buildMakerTraitsRFQ, buildOrder, signOrder, buildOrderData, buildTakerTraits } = require('../scripts/orderUtils');

describe('1inch limit order protocol tests:', async function () {
    let owner, user;
    const USDCAddress = '0xEA6B04272f9f62F997F666F07D3a974134f7FFb9';
    const WNEONAddress = '0x202C35e517Fa803B537565c40F0a6965D7204609';
    const WSOLAddress = '0x5f38248f339Bf4e84A2caf4e4c0552862dC9F82a';
    const LimitOrderProtocolAddress = '0xF40dd8107EEc3397Ab227cA67a536436e0bd80C8';
    const TakerContractAddress = '0x51ba81CbA13763687CB38e8897C06EEb6725e104';
    let LimitOrderProtocol;
    let TakerContract;
    let USDC;
    let WNEON;
    let WSOL;
    let chainId;
    if (!ethers.isAddress(LimitOrderProtocolAddress)) {
        console.log('Invalid LimitOrderProtocolAddress');
        return false;
    }

    before(async function() {
        [owner, user] = await ethers.getSigners();

        LimitOrderProtocol = await ethers.getContractAt('LimitOrderProtocol', LimitOrderProtocolAddress);
        TakerContract = await ethers.getContractAt('TakerContract', TakerContractAddress);
        USDC = await ethers.getContractAt('contracts/IERC20ForSPL.sol:IERC20ForSPL', USDCAddress);
        WNEON = await ethers.getContractAt('contracts/IERC20ForSPL.sol:IERC20ForSPL', WNEONAddress);
        WSOL = await ethers.getContractAt('contracts/IERC20ForSPL.sol:IERC20ForSPL', WSOLAddress);
        chainId = (await ethers.provider.getNetwork()).chainId;
    });

    describe('Tests:', function() {
        it('Test cancel order', async function () {
            const amountUSDC = 1000 + (Math.floor(Math.random() * 100) + 1);
            const amountWNEON = 1000 + (Math.floor(Math.random() * 100) + 1);

            const order = buildOrder({
                makerAsset: USDCAddress,
                takerAsset: WNEONAddress,
                makingAmount: amountUSDC,
                takingAmount: amountWNEON,
                maker: owner.address
            });
        
            // create user limit order signature
            const { r, yParityAndS: vs } = ethers.Signature.from(await signOrder(order, chainId, LimitOrderProtocolAddress, owner));
            
            // cancel order
            const orderData = buildOrderData(chainId, LimitOrderProtocolAddress, order);
            const orderHash = ethers.TypedDataEncoder.hash(orderData.domain, orderData.types, orderData.value);
            tx = await LimitOrderProtocol.connect(owner).cancelOrder(
                order.makerTraits,
                orderHash
            );
            await tx.wait(1);
            console.log(tx.hash, 'cancelOrder tx');
        
            await expect(
                LimitOrderProtocol.connect(owner).fillOrder(
                    order, 
                    r, 
                    vs, 
                    amountUSDC, 
                    fillWithMakingAmount(amountWNEON)
                )
            ).to.be.reverted;
        });

        it('Test filling order from an EOA ( USDC => WNEON order )', async function () {
            const userWNEONBalance = await WNEON.balanceOf(user.address);
            const takerUSDCBalance = await USDC.balanceOf(owner);
            const amountUSDC = 1000 + (Math.floor(Math.random() * 100) + 1);
            const amountWNEON = 1000 + (Math.floor(Math.random() * 100) + 1);

            // maker giving approval to protocol
            tx = await USDC.connect(user).approve(LimitOrderProtocolAddress, amountUSDC);
            await tx.wait(1);
            console.log(tx.hash, 'maker approval tx');

            // taker giving approval to protocol
            tx = await WNEON.connect(owner).approve(LimitOrderProtocolAddress, amountWNEON);
            await tx.wait(1);
            console.log(tx.hash, 'taker approval tx');

            const order = buildOrder({
                makerAsset: USDCAddress,
                takerAsset: WNEONAddress,
                makingAmount: amountUSDC,
                takingAmount: amountWNEON,
                maker: user.address
            });

            // create user limit order signature
            const { r, yParityAndS: vs } = ethers.Signature.from(await signOrder(order, chainId, LimitOrderProtocolAddress, user));

            tx = await LimitOrderProtocol.connect(owner).fillOrder(
                order, 
                r, 
                vs, 
                amountUSDC, 
                fillWithMakingAmount(amountWNEON)
            );
            await tx.wait(1);
            console.log(tx.hash, 'fillOrder tx');

            expect(await WNEON.balanceOf(user.address)).to.be.greaterThan(userWNEONBalance);
            expect(await USDC.balanceOf(owner)).to.be.greaterThan(takerUSDCBalance);
        });

        it('Test filling order from an EOA ( USDC => WSOL order )', async function () {
            const userWSOLBalance = await WSOL.balanceOf(user.address);
            const takerUSDCBalance = await USDC.balanceOf(owner);
            const amountUSDC = 1000 + (Math.floor(Math.random() * 100) + 1);
            const amountWSOL = 1000 + (Math.floor(Math.random() * 100) + 1);

            // maker giving approval to protocol
            tx = await USDC.connect(user).approve(LimitOrderProtocolAddress, amountUSDC);
            await tx.wait(1);
            console.log(tx.hash, 'maker approval tx');

            // taker giving approval to protocol
            tx = await WSOL.connect(owner).approve(LimitOrderProtocolAddress, amountWSOL);
            await tx.wait(1);
            console.log(tx.hash, 'taker approval tx');

            const order = buildOrder({
                makerAsset: USDCAddress,
                takerAsset: WSOLAddress,
                makingAmount: amountUSDC,
                takingAmount: amountWSOL,
                maker: user.address
            });

            // create user limit order signature
            const { r, yParityAndS: vs } = ethers.Signature.from(await signOrder(order, chainId, LimitOrderProtocolAddress, user));

            tx = await LimitOrderProtocol.connect(owner).fillOrder(
                order, 
                r, 
                vs, 
                amountUSDC, 
                fillWithMakingAmount(amountWSOL)
            );
            await tx.wait(1);
            console.log(tx.hash, 'fillOrder tx');

            expect(await WSOL.balanceOf(user.address)).to.be.greaterThan(userWSOLBalance);
            expect(await USDC.balanceOf(owner)).to.be.greaterThan(takerUSDCBalance);
        });

        it('Test filling order from a smart contract ( USDC => WNEON order )', async function () {
            const userWNEONBalance = await WNEON.balanceOf(user.address);
            const takerUSDCBalance = await USDC.balanceOf(TakerContractAddress);
            const amountUSDC = 1000 + (Math.floor(Math.random() * 100) + 1);
            const amountWNEON = 1000 + (Math.floor(Math.random() * 100) + 1);

            // maker giving approval to protocol
            tx = await USDC.connect(user).approve(LimitOrderProtocolAddress, amountUSDC);
            await tx.wait(1);
            console.log(tx.hash, 'maker approval tx');

            // load some WNEONs to the taker smart contract
            tx = await WNEON.connect(owner).transfer(TakerContractAddress, amountWNEON);
            await tx.wait(1);
            console.log(tx.hash, 'taker load tx');

            const order = buildOrder({
                makerAsset: USDCAddress,
                takerAsset: WNEONAddress,
                makingAmount: amountUSDC,
                takingAmount: amountWNEON,
                maker: user.address
            });

            // create user limit order signature
            const { r, yParityAndS: vs } = ethers.Signature.from(await signOrder(order, chainId, LimitOrderProtocolAddress, user));

            tx = await TakerContract.connect(owner).fillOrder(
                WNEONAddress,
                order, 
                r, 
                vs, 
                amountUSDC, 
                fillWithMakingAmount(amountWNEON)
            );
            await tx.wait(1);
            console.log(tx.hash, 'fillOrder tx');

            expect(await WNEON.balanceOf(user.address)).to.be.greaterThan(userWNEONBalance);
            expect(await USDC.balanceOf(TakerContractAddress)).to.be.greaterThan(takerUSDCBalance);
        });
    });
});