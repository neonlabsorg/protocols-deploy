const web3 = require("@solana/web3.js");

const config = {
    DATA: {
        EVM: {
            ADDRESSES: {
                TokenA: '0xd7e905d44283Bb8E892938E1a5DfAD9A909B8B84',
                TokenB: '0xc7a3018D00476D279DA2BC12f57f4607f90AFe0D',
                MockCurve: '0x3c20b30cbeb89eC2C325d9Aa6cd75C2D8F7cE709',
                TestContract: '0x160Bb319fF0c0a60F85C5D52ea4dB5A3800E1aD0'
            },
            ABIs: {
                ERC20ForSPL: [{"inputs":[{"internalType":"bytes32","name":"_tokenMint","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"bytes32","name":"spender","type":"bytes32"},{"indexed":false,"internalType":"uint64","name":"amount","type":"uint64"}],"name":"ApprovalSolana","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"bytes32","name":"to","type":"bytes32"},{"indexed":false,"internalType":"uint64","name":"amount","type":"uint64"}],"name":"TransferSolana","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"spender","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"approveSolana","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"who","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burnFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"from","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"claim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"from","type":"bytes32"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"claimTo","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenMint","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"to","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"transferSolana","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
            }
        }
    },
    utils: {
        SolanaNativeHelpers: {
            isValidHex: function(hex) {
                const isHexStrict = /^(0x)?[0-9a-f]*$/i.test(hex.toString());
                if (!isHexStrict) {
                  throw new Error(`Given value "${hex}" is not a valid hex string.`);
                }
                return isHexStrict;
            },
            hexToBuffer: function(hex) {
                const _hex = config.utils.SolanaNativeHelpers.isValidHex(hex) ? hex.replace(/^0x/i, '') : hex;
                return Buffer.from(_hex, 'hex');
            },
            numberToBuffer: function(size) {
                return Buffer.from([size]);
            },
            stringToBuffer: function(str, encoding = 'utf8') {
                return Buffer.from(str, encoding);
            },
            toBytesLittleEndian: function(num, byteLength) {
                const buffer = Buffer.alloc(byteLength);
                buffer.writeBigUInt64LE(BigInt(num), 0);
                return buffer;
            },
            toU256BE: function(bigIntNumber) {
                if (bigIntNumber < BigInt(0) || bigIntNumber > BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')) {
                    throw new Error('Number out of range for U256BE');
                }
            
                const buffer = new ArrayBuffer(32); // 256 bits = 32 bytes
                const view = new DataView(buffer);
            
                // Loop through each byte and set it from the start to maintain big-endian order
                for (let i = 0; i < 32; i++) {
                    // Extract each byte of the BigInt number
                    const byte = Number((bigIntNumber >> BigInt(8 * (31 - i))) & BigInt(0xFF));
                    view.setUint8(i, byte);
                }
            
                return new Uint8Array(buffer);
            },
            toBytesInt32: function(number, littleEndian = true) {
                const arrayBuffer = new ArrayBuffer(4); // an Int32 takes 4 bytes
                const dataView = new DataView(arrayBuffer);
                dataView.setUint32(0, number, littleEndian); // byteOffset = 0; litteEndian = false
                return arrayBuffer;
            },
            neonBalanceProgramAddressSync: function(neonWallet, neonEvmProgram, chainId) {
                const neonWalletBuffer = config.utils.SolanaNativeHelpers.hexToBuffer(neonWallet);
                const chainIdBytes = config.utils.SolanaNativeHelpers.toU256BE(BigInt(chainId)); //chain_id as u256be
                const seed = [config.utils.SolanaNativeHelpers.numberToBuffer(0x03), neonWalletBuffer, chainIdBytes];
                return web3.PublicKey.findProgramAddressSync(seed, neonEvmProgram);
            },
            neonTreeAccountAddressSync: function(neonWallet, neonEvmProgram, nonce, chainId) {
                const version = config.utils.SolanaNativeHelpers.numberToBuffer(0x03);
                const tag = config.utils.SolanaNativeHelpers.stringToBuffer('TREE');
                const address = config.utils.SolanaNativeHelpers.hexToBuffer(neonWallet);
                const _chainId = config.utils.SolanaNativeHelpers.toBytesLittleEndian(chainId, 8);
                const _nonce = config.utils.SolanaNativeHelpers.toBytesLittleEndian(nonce, 8);
                const seed = [version, tag, address, _chainId, _nonce];
                return web3.PublicKey.findProgramAddressSync(seed, neonEvmProgram);
            },
            neonAuthorityPoolAddressSync: function(neonEvmProgram) {
                const seed = [config.utils.SolanaNativeHelpers.stringToBuffer('Deposit')];
                return web3.PublicKey.findProgramAddressSync(seed, neonEvmProgram);
            },
            treasuryPoolAddressSync: function(neonEvmProgram, treasuryPoolIndex) {
                const a = config.utils.SolanaNativeHelpers.stringToBuffer('treasury_pool');
                const b = Buffer.from(config.utils.SolanaNativeHelpers.toBytesInt32(treasuryPoolIndex));
                return web3.PublicKey.findProgramAddressSync([a, b], neonEvmProgram);
            },
            createScheduledTransactionInstruction: async function(node, instructionData) {
                const {
                    neonEvmProgram: programId,
                    signerAddress,
                    balanceAddress,
                    treeAccountAddress,
                    associatedTokenAddress,
                    treasuryPool,
                    neonTransaction
                } = instructionData;

                // airdrop SOLs to treasury
                const airdropSolsRequest = await fetch(node, {
                    method: 'POST',
                    body: JSON.stringify({"jsonrpc":"2.0", "id":1, "method":"requestAirdrop", "params": [treasuryPool.publicKey.toBase58(), 1000000000]}),
                    headers: { 'Content-Type': 'application/json' }
                });
                const airdropSolsResponse = await airdropSolsRequest.json();
              
                const keys = [
                    { pubkey: signerAddress, isSigner: true, isWritable: true },
                    { pubkey: balanceAddress, isSigner: false, isWritable: true },
                    { pubkey: treasuryPool.publicKey, isSigner: false, isWritable: true },
                    { pubkey: treeAccountAddress, isSigner: false, isWritable: true },
                    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
                    { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false }
                ];
                const type = config.utils.SolanaNativeHelpers.numberToBuffer(0x4A);
                const count = Buffer.from(config.utils.SolanaNativeHelpers.toBytesInt32(treasuryPool.index));
                const transaction = config.utils.SolanaNativeHelpers.hexToBuffer(neonTransaction);
                return new web3.TransactionInstruction({ 
                    keys, 
                    programId, 
                    data: Buffer.concat(
                        [type, count, transaction]
                    )
                });
            }
        }
    }
};
module.exports = { config };