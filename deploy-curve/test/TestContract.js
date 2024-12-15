const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const fs = require("fs");
const {
    getAssociatedTokenAddress
} = require("@solana/spl-token");
const { config } = require("../scripts/config");
require("dotenv").config();

if (process.env.ANCHOR_WALLET == undefined) {
    return console.error('Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_WALLET=./id.json');
}

describe('TestContract tests:', async function () {
    const connection = new web3.Connection(process.env.SVM_NODE, "processed");
    let owner, user;
    let TokenA;
    let TokenB;
    let MockCurve;
    let TestContract;
    let neon_getEvmParams;
    let chainId;

    if (!ethers.isAddress(config.DATA.EVM.ADDRESSES.TokenA) || !ethers.isAddress(config.DATA.EVM.ADDRESSES.TokenB)) {
        console.log('Invalid erc20fospl tokens addresses');
        return false;
    } else {
        if (!ethers.isAddress(config.DATA.EVM.ADDRESSES.MockCurve)) {
            console.log('Invalid config.DATA.EVM.ADDRESSES.MockCurve');
            return false;
        }
        if (!ethers.isAddress(config.DATA.EVM.ADDRESSES.TestContract)) {
            console.log('Invalid config.DATA.EVM.ADDRESSES.TestContract');
            return false;
        }
    }

    before(async function() {
        [owner, user] = await ethers.getSigners();

        TokenA = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.TokenA);
        TokenB = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.TokenB);
        MockCurve = await ethers.getContractAt('MockCurve', config.DATA.EVM.ADDRESSES.MockCurve);
        TestContract = await ethers.getContractAt('TestContract', config.DATA.EVM.ADDRESSES.TestContract);

        const neon_getEvmParamsRequest = await fetch(network.config.url, {
            method: 'POST',
            body: JSON.stringify({"method":"neon_getEvmParams","params":[],"id":1,"jsonrpc":"2.0"}),
            headers: { 'Content-Type': 'application/json' }
        });
        neon_getEvmParams = await neon_getEvmParamsRequest.json();

        const eth_chainIdRequest = await fetch(process.env.EVM_SOL_NODE, {
            method: 'POST',
            body: JSON.stringify({"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}),
            headers: { 'Content-Type': 'application/json' }
        });
        chainId = (await eth_chainIdRequest.json()).result;

        console.log(await TokenA.tokenMint(), 'tokenMint A');
        console.log(await TokenB.tokenMint(), 'tokenMint B');
    });

    describe('Tests:', function() {
        /* it('Mint tokens to mock contracts', async function () {
            console.log(await TokenA.balanceOf(TestContract.target), 'await TokenA.balance(TestContract.target)');
            console.log(await TokenB.balanceOf(MockCurve.target), 'await TokenB.balance(MockCurve.target)');

            let tx = await TokenA.connect(owner).mint(TestContract.target, 10 * 10 ** 6);
            await tx.wait(1);
            console.log(tx, 'TokenA mint');

            tx = await TokenB.connect(owner).mint(MockCurve.target, 10 * 10 ** 6);
            await tx.wait(1);
            console.log(tx, 'TokenB mint');

            console.log(await TokenA.balanceOf(TestContract.target), 'await TokenA.balance(TestContract.target)');
            console.log(await TokenB.balanceOf(MockCurve.target), 'await TokenB.balance(MockCurve.target)');
        }); */

        it('Test SVM signing', async function () {
            console.log(await TokenA.balanceOf(TestContract.target), 'await TokenA.balance(TestContract.target)');
            console.log(await TokenB.balanceOf(MockCurve.target), 'await TokenB.balance(MockCurve.target)');

            const keypair = web3.Keypair.fromSecretKey(Uint8Array.from(new Uint8Array(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET).toString()))));
            const signerAddress = keypair.publicKey;
            console.log(signerAddress, 'signerAddress');
            const neonEvmProgram = new web3.PublicKey(neon_getEvmParams.result.neonEvmProgramId);

            const type = 0x7F;
            const neonSubType = 0x01;

            // transaction body
            const payer = ethers.dataSlice(ethers.keccak256(signerAddress.toBytes()), 12, 32);
            console.log(payer, 'payer');

            const eth_getTransactionCountRequest = await fetch(process.env.EVM_SOL_NODE, {
                method: 'POST',
                body: JSON.stringify({"method":"eth_getTransactionCount","params":[payer, "latest"],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            const nonce = (await eth_getTransactionCountRequest.json()).result;
            console.log(nonce, 'nonce');

            let test =  {
                type: 0x7F,
                neonSubType: 0x01,
                data: {
                    payer: payer,
                    sender: '0x',
                    nonce: ethers.toBeHex(parseInt(nonce, 16)),
                    index: '0x',
                    intent: '0x',
                    intentCallData: '0x',
                    target: '0x34D7402193fafC1d179596e85f5dED74f6BbB173',
                    callData: '0x095ea7b3000000000000000000000000ab1c34b53f12980a4fa9043b70c864cee6891c0c00000000000000000000000000000000000000000000000000000000075bcd15',
                    value: '0x',
                    chainId: '0x70',
                    gasLimit: '0x02540be3ff',
                    maxFeePerGas: '0x77359400',
                    maxPriorityFeePerGas: '0x0a'
                },
                defaultData: {
                    value: '0x',
                    chainId: '0x70',
                    gasLimit: '0x02540be3ff',
                    maxFeePerGas: '0x64',
                    maxPriorityFeePerGas: '0x0a'
                }
            }

            const result = [];
            for (const property in test.data) {
                result.push(test.data[property]);
            }
            console.log(ethers.encodeRlp(result), 'ethers.encodeRlp(result)');

            let neonTransaction = Buffer.concat([
                config.utils.SolanaNativeHelpers.numberToBuffer([test.type]), 
                config.utils.SolanaNativeHelpers.numberToBuffer([test.neonSubType]), 
                config.utils.SolanaNativeHelpers.hexToBuffer(ethers.encodeRlp(result))
            ]).toString('hex');

            /* const txBody = {
                payer: payer,
                sender: '0x',
                nonce: ethers.toBeHex(parseInt(nonce, 16)),
                index: '0x',
                intent: '0x',
                intentCallData: '0x',
                target: TestContract.target,
                callData: TestContract.interface.encodeFunctionData("exchange", [1 * 10 ** 6, "0x27f33b589095467766a5c83ed503e93b8ed8e3689024bd27b5356fef0adee27d"]),
                value: '0x',
                chainId: chainId,
                gasLimit: ethers.toBeHex(9999999999),
                maxFeePerGas: ethers.toBeHex(3000000000),
                maxPriorityFeePerGas: ethers.toBeHex(15)
            };
            console.log(txBody, 'txBody');

            const result = [];
            for (const property in txBody) {
                result.push(txBody[property]);
            }
            console.log(ethers.encodeRlp(result), 'ethers.encodeRlp(result)');

            let neonTransaction = Buffer.concat([
                config.utils.SolanaNativeHelpers.numberToBuffer([type]), 
                config.utils.SolanaNativeHelpers.numberToBuffer([neonSubType]), 
                config.utils.SolanaNativeHelpers.hexToBuffer(ethers.encodeRlp(result))
            ]).toString('hex'); */

            const [balanceAddress] = config.utils.SolanaNativeHelpers.neonBalanceProgramAddressSync(payer, neonEvmProgram, parseInt(chainId, 16));
            const [treeAccountAddress] = config.utils.SolanaNativeHelpers.neonTreeAccountAddressSync(payer, neonEvmProgram, nonce, parseInt(chainId, 16));
            const [authorityPoolAddress] = config.utils.SolanaNativeHelpers.neonAuthorityPoolAddressSync(neonEvmProgram);
            const associatedTokenAddress = await getAssociatedTokenAddress(new web3.PublicKey('So11111111111111111111111111111111111111112'), authorityPoolAddress, true);
            
            const index = Math.floor(Math.random() * neon_getEvmParams.result.neonTreasuryPoolCount) % neon_getEvmParams.result.neonTreasuryPoolCount;
            const treasuryPool = {
                index: index,
                publicKey: config.utils.SolanaNativeHelpers.treasuryPoolAddressSync(neonEvmProgram, index)[0]
            };

            let instruction = await config.utils.SolanaNativeHelpers.createScheduledTransactionInstruction(
                process.env.SVM_NODE,
                {
                    neonEvmProgram,
                    signerAddress,
                    balanceAddress,
                    treeAccountAddress,
                    associatedTokenAddress,
                    treasuryPool,
                    neonTransaction
                }
            );
            console.log(instruction, 'instruction');

            const transaction = new web3.Transaction();
            transaction.add(instruction);

            await sendSolanaTransaction(connection, transaction, [keypair], false, { skipPreflight: false });

            async function sendSolanaTransaction(
                connection, 
                transaction, 
                signers,
                confirm = false, 
                options, 
                name = ''
            ) {
                transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                transaction.sign(...signers);

                const signature = await connection.sendRawTransaction(transaction.serialize(), options);
                console.log(signature, 'signature');

                if (confirm) {
                    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
                }

                console.log(`\nTransaction${name ? ` ${name}` : ''} signature: ${signature}`);
                console.log(`\nhttps://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${process.env.SVM_NODE}`);
            }
        });
    });
});