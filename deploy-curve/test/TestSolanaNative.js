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

        neonProxyState = await neonEVM.getProxyState(`https://devnet.neonevm.org`);
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
            console.log(callData, 'callData');

            // let nonce = Number(await neonProxyRpcApi.getTransactionCount(solanaUser.neonWallet));
            const eth_getTransactionCountRequest = await fetch(neonProxyRpcApi.rpcUrl+ '/SOL', {
                method: 'POST',
                body: JSON.stringify({"method":"eth_getTransactionCount","params":[solanaUser.neonWallet, "latest"],"id":1,"jsonrpc":"2.0"}),
                headers: { 'Content-Type': 'application/json' }
            });
            let nonce = ethers.toBeHex(parseInt((await eth_getTransactionCountRequest.json()).result, 16));
            console.log(nonce, 'nonce');

            const scheduledTransaction = new neonEVM.ScheduledTransaction({
                nonce,
                payer: solanaUser.neonWallet,
                sender: '0x',
                value: 1000000000000000,
                target: '0xd496571BE7A0aD26c831858eE9B7C8995d9ddC2a', // TestContract.target,
                callData: '0x', // callData,
                maxFeePerGas: 5000000000,
                gasLimit: 25000,
                chainId: chainId
            });
            console.log(scheduledTransaction, 'scheduledTransaction')

            // We create a transaction for Solana, including all the previously defined data.
            const solanaTransaction = await neonEVM.createScheduledNeonEvmTransaction({
                chainId: solanaUser.chainId,
                signerAddress: solanaUser.publicKey,
                tokenMintAddress: solanaUser.tokenMint,
                neonEvmProgram,
                neonWallet: solanaUser.neonWallet,
                neonWalletNonce: nonce,
                neonTransaction: scheduledTransaction.serialize()
            });
            console.log(solanaTransaction, 'solanaTransaction')

            // It is necessary to ensure that the balance account is initialized on Solana before the Scheduled
            // transaction is executed. If it is not, an instruction to create the balance account must be added.
            console.log(solanaUser.balanceAddress, 'balanceAccount')
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

            const transactionStatus = await neonClientApi.waitTransactionTreeExecution({
                address: solanaUser.neonWallet,
                chain_id: chainId
            }, nonce, 2e3);
            console.log(transactionStatus, 'transactionStatus');

            for (const { transaction_hash, status } of transactionStatus) {
                const { receipt } = await neonProxyRpcApi.getTransactionReceipt(`0x${transaction_hash}`);
                console.log(receipt, 'receipt');
            }

            console.log(await TestContract.num(), 'TestContract counter');
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
    console.log(signature, 'signature');

    if (confirm) {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
    }

    console.log(`\nTransaction${name ? ` ${name}` : ''} signature: ${signature}`);
    console.log(`\nhttps://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${process.env.SVM_NODE}`);
}