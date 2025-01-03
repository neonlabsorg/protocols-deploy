import { Connection, Keypair, SendOptions, Signer, Transaction } from '@solana/web3.js';
// import { log, SolanaTransactionSignature } from '@neonevm/solana-sign';
import { log } from './log';
import { SolanaTransactionSignature } from '../models';
// import { solanaTransactionLog } from '@neonevm/token-transfer-core';
import { encode } from 'bs58';

// Function implementation copied from @neonevm/token-transfer-core package
function solanaTransactionLog(transaction: Transaction): void {
  console.log(transaction.instructions.map(({ programId, keys, data }, index) => {
    return `[${index}] programId: ${programId.toBase58()}
keys:
${keys.map(k => `${k.pubkey.toBase58()} [${k.isSigner ? 'signer' : ''}${k.isSigner && k.isWritable ? ', ' : ''}${k.isWritable ? 'writer' : ''}]`).join('\n')}
data:
${encode(data)}
0x${Buffer.from(data).toString('hex')}
${JSON.stringify(data)}
------------------------------`;
  }).join('\n\n'));
}

export function toSigner({ publicKey, secretKey }: Keypair): Signer {
  return { publicKey, secretKey };
}

export async function sendSolanaTransaction(connection: Connection, transaction: Transaction, signers: Signer[],
                                            confirm = false, options?: SendOptions, name = ''): Promise<SolanaTransactionSignature> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.sign(...signers);
  solanaTransactionLog(transaction);
  const signature = await connection.sendRawTransaction(transaction.serialize(), options);
  if (confirm) {
    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
  }
  log(`Transaction${name ? ` ${name}` : ''} signature: ${signature}`);
  log(`https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=http://localhost:8899`);
  return { signature, blockhash, lastValidBlockHeight };
}
