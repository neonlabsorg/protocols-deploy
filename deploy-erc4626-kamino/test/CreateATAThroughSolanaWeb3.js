const web3 = require("@solana/web3.js");
const fs = require("fs");
const {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    
} = require('@solana/spl-token');
const { config } = require('./config');

const connection = new web3.Connection('https://api.mainnet-beta.solana.com/', "processed");
if (process.env.ANCHOR_WALLET == undefined) {
    return console.error('Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_WALLET=./id.json');
}
const keypair = web3.Keypair.fromSecretKey(Uint8Array.from(new Uint8Array(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET).toString()))));
console.log(keypair.publicKey.toBase58(), 'payer');

const publicKey = new web3.PublicKey('GTCiwBTTE4BkHLAWiemrPzZxaBVD8iR3tPHmjLCEjiYL'); // set your contractPublicKey here
const tokenMintsArray = [
    config.DATA.SVM.ADDRESSES.KAMINO_RESERVE_USDC,
    config.DATA.SVM.ADDRESSES.USDC
];
let atasToBeCreated = '';

async function init() {
    if (await connection.getBalance(keypair.publicKey) < 10000000) {
        return console.error('\nYou need at least 0.01 SOL in your wallet to proceed with transactions execution.');
    }
    const transaction = new web3.Transaction();
    transaction.add(web3.ComputeBudgetProgram.setComputeUnitPrice({ 
        microLamports: 100000
    }));

    for (let i = 0, len = tokenMintsArray.length; i < len; ++i) {
        const associatedToken = getAssociatedTokenAddressSync(
            new web3.PublicKey(tokenMintsArray[i]), 
            publicKey, 
            true, 
            TOKEN_PROGRAM_ID, 
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const ataInfo = await connection.getAccountInfo(associatedToken);

        // create ATA only if it's missing
        if (!ataInfo || !ataInfo.data) {
            atasToBeCreated += tokenMintsArray[i] + ', ';

            transaction.add(
                createAssociatedTokenAccountInstruction(
                    keypair.publicKey,
                    associatedToken,
                    publicKey,
                    new web3.PublicKey(tokenMintsArray[i]), 
                    TOKEN_PROGRAM_ID, 
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            );
        }
    }

    if (transaction.instructions.length) {
        console.log('\nCreating ATA accounts for the following SPLTokens - ', atasToBeCreated.substring(0, atasToBeCreated.length - 2));
        const signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair]
        );

        console.log('\nTx signature', signature);
    } else {
        return console.error('\nNo instructions included into transaction.');
    }
} 
init();