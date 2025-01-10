const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const fs = require("fs");
const {
    getAssociatedTokenAddress
} = require("@solana/spl-token");
const bs58 = require("bs58").default
const { config } = require("../scripts/config");
require("dotenv").config();

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/*
if (process.env.ANCHOR_WALLET == undefined) {
    return console.error('Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_WALLET=./id.json');
}
*/

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

        // TokenA = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.TokenA);
        // TokenB = await ethers.getContractAt('contracts/interfaces/IERC20ForSPL.sol:IERC20ForSPL', config.DATA.EVM.ADDRESSES.TokenB);
        // MockCurve = await ethers.getContractAt('MockCurve', config.DATA.EVM.ADDRESSES.MockCurve);
        TestContract = await ethers.getContractAt('contracts/TestContract.sol:TestContract', '0xd7E0F3CE73f901dA8b5DFd2793302b2fbc0fCcF5')// config.DATA.EVM.ADDRESSES.TestContract);
/*
        TestContract = await ethers.deployContract(
            'contracts/TestContract.sol:TestContract',
            [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS]
        );
        console.log(TestContract.target)
        console.log("waiting for deployment...")
        const res = await TestContract.waitForDeployment()
        console.log(res)
        console.log("OK")
        console.log(
            '\nCreating instance of just now deployed TestERC20 contract on Neon EVM with address',
            "\x1b[33m",
            TestContract.target,
            "\x1b[0m",
            '\n'
        );
*/
        console.log(TestContract.target, 'TestContract')
        console.log(await TestContract.num(), 'TestContract counter');

        const neon_getEvmParamsRequest = await fetch(network.config.url, {
            method: 'POST',
            body: JSON.stringify({"method":"neon_getEvmParams","params":[],"id":1,"jsonrpc":"2.0"}),
            headers: { 'Content-Type': 'application/json' }
        });
        neon_getEvmParams = await neon_getEvmParamsRequest.json();
        console.log(neon_getEvmParams, 'neon_getEvmParams')
/*
        const eth_chainIdRequest = await fetch(process.env.EVM_SOL_NODE, {
            method: 'POST',
            body: JSON.stringify({"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}),
            headers: { 'Content-Type': 'application/json' }
        });
        chainId = (await eth_chainIdRequest.json()).result;
        console.log(chainId, 'chainId');
*/
        // console.log(await TokenA.tokenMint(), 'tokenMint A');
        // console.log(await TokenB.tokenMint(), 'tokenMint B');
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
            // console.log(await TokenA.balanceOf(TestContract.target), 'await TokenA.balance(TestContract.target)');
            // console.log(await TokenB.balanceOf(MockCurve.target), 'await TokenB.balance(MockCurve.target)');

            let sk = bs58.decode(process.env.SOLANA_SECRET_KEY.toString())
            const keypair = web3.Keypair.fromSecretKey(sk);
            const signerAddress = keypair.publicKey;
            console.log(signerAddress, 'signerAddress');
            const neonEvmProgram = new web3.PublicKey(neon_getEvmParams.result.neonEvmProgramId);
            console.log(neonEvmProgram, 'neonEvmProgram')

            const type = 0x7F;
            const neonSubType = 0x01;

            const neonDevnetChainId = 245022926 // Neon devnet chain Id
            const solDevnetChainId = 245022927 // Solana devnet chain Id
            console.log(parseInt(solDevnetChainId, 16), 'chainId');

            // transaction body
            // const payer = new ethers.Wallet(process.env.PRIVATE_KEY_OWNER)
            const payer = ethers.dataSlice(ethers.keccak256(signerAddress.toBytes()), 12, 32);
            console.log(payer, 'payer');

            const eth_getTransactionCountRequest = await fetch(process.env.EVM_SOL_NODE, {
                method: 'POST',
                body: JSON.stringify({"method":"eth_getTransactionCount","params":[payer, "latest"],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });

            const nonce = '0x01'; (await eth_getTransactionCountRequest.json()).result;
            console.log(nonce, 'nonce');

            const callData =  ethers.keccak256(Buffer.from('increaseNum()')).substring(0,10)
            console.log(callData, 'callData');

            let test =  {
                type: 0x7F,
                neonSubType: 0x01,
                data: {
                    payer: payer,
                    sender: '0x',
                    nonce: '0x01', // ethers.toBeHex(parseInt(nonce, 16)),
                    index: '0x',
                    intent: '0x',
                    intentCallData: '0x',
                    target: TestContract.target,
                    callData: callData,
                    value: '0x',
                    chainId: ethers.toBeHex(solDevnetChainId), // ethers.toBeHex(parseInt(chainId, 16)),
                    gasLimit: '0x0186a0',
                    maxFeePerGas: '0x3b9aca00',
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
            console.log(test, 'transaction')

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


            const [balanceAddress] = config.utils.SolanaNativeHelpers.neonBalanceProgramAddressSync(payer, neonEvmProgram, solDevnetChainId);
            const [treeAccountAddress] = config.utils.SolanaNativeHelpers.neonTreeAccountAddressSync(payer, neonEvmProgram, nonce, solDevnetChainId);
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

                console.log(TestContract.target, 'TestContract')
                console.log(await TestContract.num(), 'TestContract counter');
            }
        });
    });
});