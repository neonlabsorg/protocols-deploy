const { ethers } = require("hardhat");
const { expect } = require("chai");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

describe('L0', async function () {
    let owner;
    let chainId;
    const SEPOLIA = {
        OAPP: '0x6300ed43e317a4055540785cfdec3523b9666f9f',
        ENDPOINT: '0x6EDCE65403992e310A62460808c4b910D972f10f',
        DST_EID: 40161
    };
    const HOLESKY = {
        OAPP: '0x7ef6134eF60dA749240C99b46402cfFd54A6ED1f',
        ENDPOINT: '0x6EDCE65403992e310A62460808c4b910D972f10f',
        DST_EID: 40217
    };
    let contractInstance;

    before(async function() {
        [owner] = await ethers.getSigners();
        chainId = (await ethers.provider.getNetwork()).chainId;
        
        let contractAddress = '';
        let endpoint;
        if (chainId == 11155111) {
            contractAddress = SEPOLIA.OAPP;
            endpoint = SEPOLIA.ENDPOINT;
        } else {
            contractAddress = HOLESKY.OAPP;
            endpoint = HOLESKY.ENDPOINT;
        }

        const contractFactory = await ethers.getContractFactory('contracts/TestOApp.sol:TestOApp');

        if (ethers.isAddress(contractAddress)) {
            contractInstance = contractFactory.attach(contractAddress);
        } else {
            // deploy ERC20ForSPLFactory
            contractInstance = await ethers.deployContract('contracts/TestOApp.sol:TestOApp', [
                endpoint
            ]);
            await contractInstance.waitForDeployment();
            console.log('\nCreating instance of just now deployed Sepolia instance with address', "\x1b[32m", contractInstance.target, "\x1b[30m", '\n'); 
        }

        console.log(await contractInstance.lastMessage(), 'lastMessage');
    });

    describe('Tests:', function() {
        it('setPeer', async function () {
            const dstEid = (chainId == 11155111) ? HOLESKY.DST_EID : SEPOLIA.DST_EID;
            const dstAddress = (chainId == 11155111) ? HOLESKY.OAPP : SEPOLIA.OAPP;
            console.log(await contractInstance.getPeer(dstEid), 'peers');

            if (await contractInstance.getPeer(dstEid) == ethers.zeroPadValue(ethers.toBeHex(0), 32)) {
                let tx = await contractInstance.setPeer(dstEid, ethers.zeroPadValue(ethers.toBeHex(dstAddress), 32));
                await tx.wait(1);

                console.log(await contractInstance.getPeer(dstEid), 'peers');
            } else {
                console.log('Peer already set');
            }
        });

        it('sendString', async function () {
            const dstEid = (chainId == 11155111) ? HOLESKY.DST_EID : SEPOLIA.DST_EID;
            const message = 'Hello from ' + chainId + '! Timestamp: ' + Math.floor(Date.now() / 1000);
            const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

            let nativeFee = 0;
            const messagingFee = await contractInstance.quoteSendString(dstEid, message, options, false);
            nativeFee = messagingFee.nativeFee;
            console.log(messagingFee, 'messagingFee');

            let tx = await contractInstance.sendString(
                dstEid,
                message,
                options, 
                {value: nativeFee.toString()}
            );
            await tx.wait(1);
        });
    });
});