import pkg from "hardhat"
const { ethers } = pkg;
import * as solanaWeb3 from "@solana/web3.js"
import * as neonEVM from "@neonevm/solana-sign"
import * as bs58 from "bs58"

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const TEST_CONTRACT_ADDRESS = '0xd7E0F3CE73f901dA8b5DFd2793302b2fbc0fCcF5'

describe('TestContract tests:', async function () {
    let solanaConnection;
    let owner, user;
    let TestContract;
    let solanaKeyPair;
    let neonProxyState;
    let neonProxyRpcApi;
    let neonEvmProgram;
    let solanaUser;
    let chainId;

    before(async function(){
        solanaConnection = new solanaWeb3.Connection(process.env.SVM_NODE, "processed");
        [owner, user] = await ethers.getSigners();
        if(TEST_CONTRACT_ADDRESS) {
            TestContract = await ethers.getContractAt(
                'contracts/TestContract.sol:TestContract',
                TEST_CONTRACT_ADDRESS
            )
        } else {
            TestContract = await ethers.deployContract(
                'contracts/TestContract.sol:TestContract',
                [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS]
            );
            const res = await TestContract.waitForDeployment()
        }
        console.log(TestContract.target, 'TestContract address')
        console.log(await TestContract.num(), 'TestContract counter');

        const solanaPrivateKey = bs58.default.decode(process.env.SOLANA_SECRET_KEY.toString());
        solanaKeyPair = solanaWeb3.Keypair.fromSecretKey(solanaPrivateKey);
        console.log(solanaKeyPair, 'solanaKeyPair')

        neonProxyState = await neonEVM.getProxyState(process.env.EVM_SOL_NODE);
        console.log(neonProxyState, 'neonProxyState')
        neonProxyRpcApi = neonProxyState.proxyApi;
        console.log(neonProxyRpcApi, 'neonProxyRpcApi')

        neonEvmProgram = neonProxyState.evmProgramAddress;
        const devnetSolChainId = 245022927
        const gasToken = neonEVM.getGasToken(neonProxyState.tokensList, devnetSolChainId).gasToken;
        // const gasToken = neonEVM.getGasToken(neonProxyState.tokensList, 245022926).gasToken;

        console.log(gasToken, 'gasToken')

        chainId = Number(gasToken.tokenChainId);
        const gasTokenMint = new solanaWeb3.PublicKey(gasToken.tokenMint);

        solanaUser = neonEVM.SolanaNeonAccount.fromKeypair(solanaKeyPair, neonEvmProgram, gasTokenMint, chainId);
        console.log(solanaUser, 'solanaUser')
    });

    describe('Tests:', function() {
        it('Test SVM signing', async function () {
            const callData =  ethers.keccak256(Buffer.from('increaseNum()')).substring(0,10)

            // let nonce = Number(await neonProxyRpcApi.getTransactionCount(solanaUser.neonWallet));
            const eth_getTransactionCountRequest = await fetch(neonProxyRpcApi.rpcUrl, {
                method: 'POST',
                body: JSON.stringify({"method":"eth_getTransactionCount","params":[solanaUser.neonWallet, "latest"],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            let nonce =(await eth_getTransactionCountRequest.json()).result;
            console.log(nonce, 'nonce');

            let maxFeePerGas = 10000000000
            const multipleTransactions = new neonEVM.MultipleTransactions(nonce, maxFeePerGas);

            let scheduledTransactions = [];
            for (let i = 0; i < 4; i++) {
                scheduledTransactions.push(new neonEVM.ScheduledTransaction({
                    index: i,
                    nonce: ethers.toBeHex(parseInt(nonce, 16)),
                    payer: solanaUser.neonWallet,
                    sender: '0x',
                    value: 0,
                    target: TestContract.target,
                    callData: callData,
                    maxFeePerGas: maxFeePerGas,
                    gasLimit: 1000000,
                    chainId: solanaUser.chainId
                }))
            }

            multipleTransactions.addTransaction(scheduledTransactions[0], 3, 0);
            multipleTransactions.addTransaction(scheduledTransactions[1], 3, 0);
            multipleTransactions.addTransaction(scheduledTransactions[2], 3, 0);
            multipleTransactions.addTransaction(scheduledTransactions[3], neonEVM.NO_CHILD_INDEX, 3);

            // We create a transaction for Solana, including all the previously defined data.
            const solanaTransaction = await neonEVM.createScheduledNeonEvmMultipleTransaction({
                chainId: solanaUser.chainId,
                signerAddress: solanaUser.publicKey,
                tokenMintAddress: solanaUser.tokenMint,
                neonEvmProgram,
                neonWallet: solanaUser.neonWallet,
                neonWalletNonce: nonce,
                neonTransaction: multipleTransactions.data,
            });

            // It is necessary to ensure that the balance account is initialized on Solana before the Scheduled
            // transaction is executed. If it is not, an instruction to create the balance account must be added.
            const balanceAccount = await solanaConnection.getAccountInfo(solanaUser.balanceAddress)
            if (balanceAccount === null) {
                solanaTransaction.instructions.unshift(neonEVM.createBalanceAccountInstruction(
                    neonEvmProgram,
                    solanaUser.publicKey,
                    solanaUser.neonWallet,
                    solanaUser.chainId
                ))
            }

            // Sign and send the transaction to the Solana network
            await sendSolanaTransaction(
                solanaConnection,
                solanaTransaction,
                [solanaKeyPair],
                false,
                { skipPreflight: false }
            );
            await asyncTimeout(30000)

            let neon_sendRawScheduledTransactionRequest = await fetch(neonProxyRpcApi.rpcUrl, {
                method: 'POST',
                body: JSON.stringify({"method":"neon_sendRawScheduledTransaction","params":[`0x${scheduledTransactions[0].serialize()}`],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            let sendRawScheduledTransactionResult = (await neon_sendRawScheduledTransactionRequest.json())// .result;
            console.log(sendRawScheduledTransactionResult, 'sendRawScheduledTransactionResult 0');

            neon_sendRawScheduledTransactionRequest = await fetch(neonProxyRpcApi.rpcUrl, {
                method: 'POST',
                body: JSON.stringify({"method":"neon_sendRawScheduledTransaction","params":[`0x${scheduledTransactions[1].serialize()}`],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            sendRawScheduledTransactionResult = (await neon_sendRawScheduledTransactionRequest.json())// .result;
            console.log(sendRawScheduledTransactionResult, 'sendRawScheduledTransactionResult 1');

            neon_sendRawScheduledTransactionRequest = await fetch(neonProxyRpcApi.rpcUrl, {
                method: 'POST',
                body: JSON.stringify({"method":"neon_sendRawScheduledTransaction","params":[`0x${scheduledTransactions[2].serialize()}`],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            sendRawScheduledTransactionResult = (await neon_sendRawScheduledTransactionRequest.json())// .result;
            console.log(sendRawScheduledTransactionResult, 'sendRawScheduledTransactionResult 2');

            neon_sendRawScheduledTransactionRequest = await fetch(neonProxyRpcApi.rpcUrl, {
                method: 'POST',
                body: JSON.stringify({"method":"neon_sendRawScheduledTransaction","params":[`0x${scheduledTransactions[3].serialize()}`],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            sendRawScheduledTransactionResult = (await neon_sendRawScheduledTransactionRequest.json())// .result;
            console.log(sendRawScheduledTransactionResult, 'sendRawScheduledTransactionResult 3');

            const neon_getPendingTransactionsRequest = await fetch(neonProxyRpcApi.rpcUrl, {
                method: 'POST',
                body: JSON.stringify({"method":"neon_getPendingTransactions","params":[solanaUser.publicKey.toBase58()],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            let pendingTransactions =(await neon_getPendingTransactionsRequest.json()).result;
            console.log(pendingTransactions, 'pendingTransactions');
/*
            const transactionStatus = await neonClientApi.waitTransactionTreeExecution({
                address: solanaUser.neonWallet,
                chain_id: chainId
            }, nonce, 2e3);
            console.log(transactionStatus, 'transactionStatus');

            for (const { transaction_hash, status } of transactionStatus) {
                const { receipt } = await neonProxyRpcApi.getTransactionReceipt(`0x${transaction_hash}`);
                console.log(receipt, 'receipt');
            }
*/
        });
    });
});

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
    if (confirm) {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
    }

    console.log(`\nTransaction${name ? ` ${name}` : ''} signature: ${signature}`);
    console.log(`\nhttps://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${process.env.SVM_NODE}`);
}

async function asyncTimeout(timeout) {
    return new Promise((resolve)=> {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}
