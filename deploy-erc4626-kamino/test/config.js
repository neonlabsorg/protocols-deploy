const web3 = require("@solana/web3.js");

const config = {
    SOLANA_NODE: 'https://multi-aged-slug.solana-mainnet.quiknode.pro/9574b5ff21fbf0d63c0d3a3a5c8bae4f044039af',
    //SOLANA_NODE: 'https://mainnet.helius-rpc.com/?api-key=b16ea4e8-7111-4e66-8d4f-4f7775fd059e',
    DATA: {
        SVM: {
            ADDRESSES: {
                WSOL: 'So11111111111111111111111111111111111111112',
                USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                WBTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
                RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                NEON_PROGRAM: 'NeonVMyRX5GbCrsAHnUwx1nYYoJAtskU1bWUo6JGNyG',
                KAMINO_MAIN_MARKET: '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF',
                KAMINO_RESERVE_USDC: 'B8V6WVjPxW1UGwVDfxH2d2r8SyT4cqn7dQRK6XneVa7D',
            }
        },
        EVM: {
            ADDRESSES: {
                WSOL: '0x5f38248f339bf4e84a2caf4e4c0552862dc9f82a',
                USDC: '0xea6b04272f9f62f997f666f07d3a974134f7ffb9',
                USDT: '0x5f0155d08eF4aaE2B500AefB64A3419dA8bB611a',
                WBTC: '0x16a3Fe59080D6944A42B441E44450432C1445372'
            },
            ABIs: {
                ERC20ForSPL: [{"inputs":[{"internalType":"bytes32","name":"_tokenMint","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"bytes32","name":"spender","type":"bytes32"},{"indexed":false,"internalType":"uint64","name":"amount","type":"uint64"}],"name":"ApprovalSolana","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"bytes32","name":"to","type":"bytes32"},{"indexed":false,"internalType":"uint64","name":"amount","type":"uint64"}],"name":"TransferSolana","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"spender","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"approveSolana","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"who","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burnFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"from","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"claim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"from","type":"bytes32"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"claimTo","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenMint","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"to","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"transferSolana","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
            }
        }
    },
    utils: {
        prepareInstructionAccounts: function(instruction, overwriteAccounts) {
            let encodeKeys = '';
            for (let i = 0, len = instruction.keys.length; i < len; ++i) {
                if (typeof(overwriteAccounts) != "undefined" && Object.hasOwn(overwriteAccounts, i)) {
                    console.log(config.utils.publicKeyToBytes32(overwriteAccounts[i].key), 'publicKey');
                    encodeKeys+= ethers.solidityPacked(["bytes32"], [config.utils.publicKeyToBytes32(overwriteAccounts[i].key)]).substring(2);
                    encodeKeys+= ethers.solidityPacked(["bool"], [overwriteAccounts[i].isSigner]).substring(2);
                    encodeKeys+= ethers.solidityPacked(["bool"], [overwriteAccounts[i].isWritable]).substring(2);
                } else {
                    console.log(config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString()), 'publicKey');
                    encodeKeys+= ethers.solidityPacked(["bytes32"], [config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString())]).substring(2);
                    encodeKeys+= ethers.solidityPacked(["bool"], [instruction.keys[i].isSigner]).substring(2);
                    encodeKeys+= ethers.solidityPacked(["bool"], [instruction.keys[i].isWritable]).substring(2);
                }
            }

            return '0x' + ethers.zeroPadBytes(ethers.toBeHex(instruction.keys.length), 8).substring(2) + encodeKeys;
        },
        prepareInstructionData: function(instruction) {
            const packedInstructionData = ethers.solidityPacked( 
                ["bytes"],
                [instruction.data]
            ).substring(2);
            console.log(packedInstructionData, 'packedInstructionData');

            return '0x' + ethers.zeroPadBytes(ethers.toBeHex(instruction.data.length), 8).substring(2) + packedInstructionData;
        },
        prepareInstruction: function(instruction) {
            return config.utils.publicKeyToBytes32(instruction.programId.toBase58()) + config.utils.prepareInstructionAccounts(instruction).substring(2) + config.utils.prepareInstructionData(instruction).substring(2);
        },
        execute: async function(instruction, lamports, contractInstance, salt, msgSender) { 
            if (salt == undefined) {
                salt = '0x0000000000000000000000000000000000000000000000000000000000000000';
            }

            const tx = await contractInstance.connect(msgSender).execute(
                lamports,
                salt,
                config.utils.prepareInstruction(instruction)
            );

            const receipt = await tx.wait(3);
            return [tx, receipt];
        },
        batchExecute: async function(instructions, lamports, contractInstance, salts, msgSender) {
            let setSalts = false;
            if (salts == undefined) {
                setSalts = true;
                salts = [];
            }

            let instructionsDataArr = [];
            for (let i = 0, len = instructions.length; i < len; ++i) {
                instructionsDataArr.push(config.utils.prepareInstruction(instructions[i]));

                if (setSalts) {
                    salts.push('0x0000000000000000000000000000000000000000000000000000000000000000');
                }
            }
    
            const tx = await contractInstance.connect(msgSender).batchExecute(
                lamports,
                salts,
                instructionsDataArr
            );
            const receipt = await tx.wait(3);

            return [tx, receipt];
        },
        publicKeyToBytes32: function(pubkey) {
            return ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(pubkey)), 32);
        },
        addressToBytes32: function(address) {
            return ethers.zeroPadValue(ethers.toBeHex(address), 32);
        },
        calculateTokenAccount: function (tokenEvmAddress, userEvmAddress, neonEvmProgram) {
            const neonAccountAddressBytes = Buffer.concat([Buffer.alloc(12), Buffer.from(config.utils.isValidHex(userEvmAddress) ? userEvmAddress.substring(2) : userEvmAddress, 'hex')]);
            const seed = [
                new Uint8Array([0x03]),
                new Uint8Array(Buffer.from('ContractData', 'utf-8')),
                Buffer.from(tokenEvmAddress.substring(2), 'hex'),
                Buffer.from(neonAccountAddressBytes, 'hex')
            ];
        
            return web3.PublicKey.findProgramAddressSync(seed, neonEvmProgram);
        },
        isValidHex: function(hex) {
            const isHexStrict = /^(0x)?[0-9a-f]*$/i.test(hex.toString());
            if (!isHexStrict) {
                throw new Error(`Given value "${hex}" is not a valid hex string.`);
            } else {
                return isHexStrict;
            }
        },
        toFixed: function(num, fixed) {
            let re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
            return num.toString().match(re)[0];
        }
    },
    kaminoHelper: {
        loadReserveData: async function({ connection, marketPubkey, mintPubkey, KaminoMarket, DEFAULT_RECENT_SLOT_DURATION_MS }) {
            const market = await config.kaminoHelper.getMarket({ connection, marketPubkey, KaminoMarket, DEFAULT_RECENT_SLOT_DURATION_MS });
            const reserve = market.getReserveByMint(mintPubkey);
            if (!reserve) {
              throw Error(`Could not load reserve for ${mintPubkey.toString()}`);
            }
            const currentSlot = await connection.getSlot();
          
            return { market, reserve, currentSlot };
        },
        getMarket: async function({ connection, marketPubkey, KaminoMarket, DEFAULT_RECENT_SLOT_DURATION_MS }) {
            const market = await KaminoMarket.load(connection, marketPubkey, DEFAULT_RECENT_SLOT_DURATION_MS);
            if (!market) {
              throw Error(`Could not load market ${marketPubkey.toString()}`);
            }
            return market;
        }
    }
};
module.exports = { config };