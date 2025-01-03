import { ChainId } from '@pancakeswap/chains'
import { useTranslation } from '@pancakeswap/localization'
import { TradeType } from '@pancakeswap/sdk'
import { SmartRouter } from '@pancakeswap/smart-router'
import { formatAmount } from '@pancakeswap/utils/formatFractions'
import truncateHash from '@pancakeswap/utils/truncateHash'
import { useUserSlippage } from '@pancakeswap/utils/user'
import { INITIAL_ALLOWED_SLIPPAGE } from 'config/constants'
import { useMemo } from 'react'
import { useSwapState } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin, safeGetAddress } from 'utils'
import { basisPointsToPercent } from 'utils/exchange'
import { logSwap, logTx } from 'utils/log'
import { isUserRejected } from 'utils/sentry'
import { transactionErrorToUserReadableMessage } from 'utils/transactionErrorToUserReadableMessage'
import {
  Address,
  Hex,
  SendTransactionReturnType,
  TransactionExecutionError,
  UserRejectedRequestError,
  hexToBigInt,
} from 'viem'
import { useSendTransaction } from 'wagmi'
import { utils } from 'ethers';
import * as solanaWeb3 from '@solana/web3.js'
import * as bs58 from 'bs58'

import * as neonEVM from 'utils/neonevm-solana-sign'
import { usePaymaster } from 'hooks/usePaymaster'
import { ClassicOrder } from '@pancakeswap/price-api-sdk'
import { logger } from 'utils/datadog'
import { viemClients } from 'utils/viem'
import { isZero } from '../utils/isZero'
import { Transaction } from '@solana/web3.js'

interface SwapCall {
  address: Address
  calldata: Hex
  value: Hex
}

interface WallchainSwapCall {
  getCall: () => Promise<SwapCall & { gas: string }>
}

interface SwapCallEstimate {
  call: SwapCall | WallchainSwapCall
}

interface SuccessfulCall extends SwapCallEstimate {
  call: SwapCall | WallchainSwapCall
  gasEstimate: bigint
}

interface FailedCall extends SwapCallEstimate {
  call: SwapCall | WallchainSwapCall
  error: Error
}

export class TransactionRejectedError extends Error {}

// returns a function that will execute a swap, if the parameters are all valid
export default function useSendSwapTransaction(
  account?: Address,
  chainId?: number,
  trade?: ClassicOrder['trade'] | null, // trade to execute, required
  swapCalls: SwapCall[] | WallchainSwapCall[] = [],
  type: 'V3SmartSwap' | 'UniversalRouter' = 'V3SmartSwap',
) {
  const { t } = useTranslation()
  const addTransaction = useTransactionAdder()
  const { sendTransactionAsync } = useSendTransaction()
  const publicClient = viemClients[chainId as ChainId]
  const [allowedSlippage] = useUserSlippage() || [INITIAL_ALLOWED_SLIPPAGE]
  const { recipient } = useSwapState()
  const recipientAddress = recipient === null ? account : recipient

  // Paymaster for zkSync
  const { isPaymasterAvailable, isPaymasterTokenActive, sendPaymasterTransaction } = usePaymaster()

  return useMemo(() => {
    if (!trade || !sendTransactionAsync || !account || !chainId || !publicClient) {
      return { callback: null }
    }
    return {
      callback: async function onSwap() {
        const estimatedCalls: SwapCallEstimate[] = await Promise.all(
          swapCalls.map((call) => {
            const { address, calldata, value } = call
            if ('getCall' in call) {
              // Only WallchainSwapCall, don't use rest of pipeline
              return {
                call,
                gasEstimate: undefined,
              }
            }
            const tx =
              !value || isZero(value)
                ? { account, to: address, data: calldata, value: 0n }
                : {
                    account,
                    to: address,
                    data: calldata,
                    value: hexToBigInt(value),
                  }
            return publicClient
              .estimateGas(tx)
              .then((gasEstimate) => {
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch((gasError) => {
                console.debug('Gas estimate failed, trying to extract error', call, gasError)
                return { call, error: transactionErrorToUserReadableMessage(gasError, t) }
              })
          }),
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        let bestCallOption: SuccessfulCall | SwapCallEstimate | undefined = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1]),
        )

        // check if any calls errored with a recognizable error
        if (!bestCallOption) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          const firstNoErrorCall = estimatedCalls.find<SwapCallEstimate>(
            (call): call is SwapCallEstimate => !('error' in call),
          )
          if (!firstNoErrorCall) throw new Error(t('Unexpected error. Could not estimate gas for the swap.'))
          bestCallOption = firstNoErrorCall
        }

        const call =
          'getCall' in bestCallOption.call
            ? await bestCallOption.call.getCall()
            : (bestCallOption.call as SwapCall & { gas?: string | bigint })

        if ('error' in call) {
          throw new Error('Route lost. Need to restart.')
        }

        if ('gas' in call && call.gas) {
          // prepared Wallchain's call have gas estimate inside
          call.gas = BigInt(call.gas)
        } else {
          call.gas =
            'gasEstimate' in bestCallOption && bestCallOption.gasEstimate
              ? calculateGasMargin(bestCallOption.gasEstimate, 2000n)
              : undefined
        }

        let sendTxResult: Promise<SendTransactionReturnType> | undefined

        if (isPaymasterAvailable && isPaymasterTokenActive) {
          sendTxResult = sendPaymasterTransaction(call, account)
        } else {

          const solanaPrivateKey = bs58.decode(`4uk3wcD2KNf6athPWNkMvBQDXR611e8XhS8BomVnTJypYJpxJun6GyinJ9z9TRJtNfZdptYLGh6RL7GE3Xj33HGM`);
          const keypair = solanaWeb3.Keypair.fromSecretKey(solanaPrivateKey);
          console.log(keypair, 'keypair')

          // Establish connection to Solana provider
          /*
          const solanaProvider = await getSolanaProvider()
          console.log(solanaProvider, 'solanaProvider')
          let solanaAccountPublicKey : solanaWeb3.PublicKey
          */
          let solanaConnection: solanaWeb3.Connection
          try {
            /*
            console.log('Connecting to Phantom provider...')
            @ts-ignore
            const res = await solanaProvider.connect()
            solanaAccountPublicKey = res.publicKey
            console.log('Connected to Phantom provider. Solana public key:', solanaAccountPublicKey.toString())
            */
            solanaConnection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'))
            console.log('Solana RPC endpoint:', solanaConnection.rpcEndpoint)
          } catch (err) {
            console.error(
              'Could not connect to Phantom provider. Please make sure Phantom browser extension is installed and unlocked.',
            )
          }

          // Schedule NeonEVM transaction on Solana
          // @ts-ignore
          // if(solanaAccountPublicKey &&
          // @ts-ignore
          if(solanaConnection) {
            console.log('Getting Neon proxy state...')

            const neonProxy = await neonEVM.getProxyState(`https://devnet.neonevm.org`);
            console.log(neonProxy, 'getProxyState result')

            const neonProxyRpcApi = neonProxy.proxyApi;
            const neonEvmProgram = neonProxy.evmProgramAddress;
            const token = neonEVM.getGasToken(neonProxy.tokensList, neonEVM.NeonChainId.devnetSol);
            console.log(token, 'token')

            // const provider = new JsonRpcProvider(`https://devnet.neonevm.org`);
            // const neonClientApi = new neonEVM.NeonClientApi(`<neon_client_api_url>`);
            const tokenChainId = Number(token.gasToken.tokenChainId);
            const chainTokenMint = new solanaWeb3.PublicKey(token.gasToken.tokenMint);

            const solanaUser = neonEVM.SolanaNeonAccount.fromKeypair(keypair, neonEvmProgram, chainTokenMint, tokenChainId);
            /*
            const solanaUser = new neonEVM.SolanaNeonAccount(
              solanaAccountPublicKey,
              neonEvmProgram,
              chainTokenMint,
              tokenChainId
            );
            */
            console.log(solanaUser, 'solanaUser')
            console.log(solanaUser.publicKey.toString(), 'solanaUser.publicKey')
            console.log(solanaUser.neonWallet, 'solanaUser.neonWallet')

            const nonce = Number(await neonProxyRpcApi.getTransactionCount(solanaUser.neonWallet));
            const maxFeePerGas = 0x77359400;

            console.log(nonce, 'nonce')
            console.log(maxFeePerGas, 'maxFeePerGas')
            console.log(neonEVM.NeonChainId.devnetSol, 'neonEVM.NeonChainId.devnetSol')

            // We create a Scheduled transaction embedding the contract address and the method call data. Additionally,
            // we retrieve the nonce for the Neon wallet and include this information in the Scheduled transaction.

            const approveWNEONCallData = '0x095ea7b300000000000000000000000041207f05fa41fbdcbf756bf75d3da342062760d80000000000000000000000000000000000000000204fce5e3e25026110000000';
            const wNEONAddress = '0x11adC2d986E334137b9ad0a0F290771F31e9517F'
            const scheduledTransaction = new neonEVM.ScheduledTransaction({
              nonce,
              payer: solanaUser.neonWallet, // Does this account need to be funded with NEON?
              sender: '0x',
              target: wNEONAddress, // call.address,
              callData: approveWNEONCallData, // call.calldata,
              maxFeePerGas: 1000000000, // 1 gwei
              gasLimit: 2000000,
              chainId: neonEVM.NeonChainId.devnetSol
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

            /*
            const treasuryPool = solanaTransaction.instructions[0].keys[2].pubkey;
            console.log(treasuryPool, 'treasuryPool')
            const airdropResult = await neonEVM.solanaAirdrop(solanaConnection, treasuryPool, 21e9);
            console.log(airdropResult, 'airdropResult')
            */

            // It is necessary to ensure that the balance account is initialized on Solana before the Scheduled
            // transaction is executed. If it is not, an instruction to create the balance account must be added.
            const balanceAccount = await solanaConnection.getAccountInfo(solanaUser.balanceAddress)
            console.log(balanceAccount, 'balanceAccount')
            console.log(solanaUser.balanceAddress, 'balanceAccount address')

            if (balanceAccount === null) {
              solanaTransaction.instructions.unshift(neonEVM.createBalanceAccountInstruction(
                neonEvmProgram,
                solanaUser.publicKey,
                solanaUser.neonWallet,
                solanaUser.chainId
              ))
            }

            /*
            const solanaTransaction =  new Transaction()
            solanaTransaction.add(neonEVM.createBalanceAccountInstruction(
              neonEvmProgram,
              solanaUser.publicKey,
              solanaUser.neonWallet,
              solanaUser.chainId
            ));
            */

            // Sign and send the transaction to the Solana network.
            const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash()
            solanaTransaction.recentBlockhash = blockhash
            solanaTransaction.feePayer = keypair.publicKey // solanaAccountPublicKey
            console.log(solanaTransaction, 'solanaTransaction')

            // @ts-ignore
            // const result = await solanaProvider.signAndSendTransaction(solanaTransaction) //, solanaConnection)
            // console.log(solanaProvider, 'solanaProvider')

            // @ts-ignore
            // const signedSolanaTransaction = await solanaProvider.signTransaction(solanaTransaction) //, solanaConnection)
            // console.log('Solana transaction signature', signedSolanaTransaction.signature.toString('hex'))


            solanaTransaction.sign({ publicKey: keypair.publicKey, secretKey: keypair.secretKey })
            console.log(solanaTransaction, 'signedSolanaTransaction')

            try {
              const signature = await solanaConnection.sendRawTransaction(
                solanaTransaction.serialize(),
                { skipPreflight: true }
              )
              console.log('signature', signature.toString())
            } catch(err: any) {
              console.log('error', err)
              console.error(await err.getLogs())
            }


            // sendTxResult = new Promise((resolve) => {})
          }

          sendTxResult = sendTransactionAsync({
            account,
            chainId,
            to: call.address,
            data: call.calldata,
            value: call.value && !isZero(call.value) ? hexToBigInt(call.value) : 0n,
            gas: call.gas,
          })
        }

        return sendTxResult
          .then((response) => {
            const inputSymbol = trade.inputAmount.currency.symbol
            const outputSymbol = trade.outputAmount.currency.symbol
            const pct = basisPointsToPercent(allowedSlippage)
            const inputAmount =
              trade.tradeType === TradeType.EXACT_INPUT
                ? formatAmount(trade.inputAmount, 3)
                : formatAmount(SmartRouter.maximumAmountIn(trade, pct), 3)
            const outputAmount =
              trade.tradeType === TradeType.EXACT_OUTPUT
                ? formatAmount(trade.outputAmount, 3)
                : formatAmount(SmartRouter.minimumAmountOut(trade, pct), 3)

            const base = `Swap ${
              trade.tradeType === TradeType.EXACT_OUTPUT ? 'max.' : ''
            } ${inputAmount} ${inputSymbol} for ${
              trade.tradeType === TradeType.EXACT_INPUT ? 'min.' : ''
            } ${outputAmount} ${outputSymbol}`

            const recipientAddressText =
              recipientAddress && safeGetAddress(recipientAddress) ? truncateHash(recipientAddress) : recipientAddress

            const withRecipient = recipient === account ? base : `${base} to ${recipientAddressText}`

            const translatableWithRecipient =
              trade.tradeType === TradeType.EXACT_OUTPUT
                ? recipient === account
                  ? 'Swap max. %inputAmount% %inputSymbol% for %outputAmount% %outputSymbol%'
                  : 'Swap max. %inputAmount% %inputSymbol% for %outputAmount% %outputSymbol% to %recipientAddress%'
                : recipient === account
                ? 'Swap %inputAmount% %inputSymbol% for min. %outputAmount% %outputSymbol%'
                : 'Swap %inputAmount% %inputSymbol% for min. %outputAmount% %outputSymbol% to %recipientAddress%'
            addTransaction(
              { hash: response },
              {
                summary: withRecipient,
                translatableSummary: {
                  text: translatableWithRecipient,
                  data: {
                    inputAmount,
                    inputSymbol,
                    outputAmount,
                    outputSymbol,
                    ...(recipient !== account && { recipientAddress: recipientAddressText }),
                  },
                },
                type: 'swap',
              },
            )
            logSwap({
              tradeType: trade.tradeType,
              account,
              chainId,
              hash: response,
              inputAmount,
              outputAmount,
              input: trade.inputAmount.currency,
              output: trade.outputAmount.currency,
              type,
            })
            logTx({ account, chainId, hash: response })
            return { hash: response }
          })
          .catch((error) => {
            // if the user rejected the tx, pass this along
            if (isUserRejected(error)) {
              throw new TransactionRejectedError(t('Transaction rejected'))
            } else {
              // otherwise, the error was unexpected and we need to convey that
              logger.warn(
                'Swap failed',
                {
                  chainId,
                  input: trade.inputAmount.currency,
                  output: trade.outputAmount.currency,
                  address: call.address,
                  value: call.value,
                  type,
                  target: 'AMM',
                  errorName: error?.name,
                  cause: error instanceof TransactionExecutionError ? error.cause : undefined,
                },
                error,
              )

              if (isPaymasterAvailable && isPaymasterTokenActive) {
                throw new Error(
                  `Swap failed: ${t('Try again with more gas token balance.')} ${transactionErrorToUserReadableMessage(
                    error,
                    t,
                  )}`,
                )
              }

              throw new Error(`Swap failed: ${transactionErrorToUserReadableMessage(error, t)}`)
            }
          })
      },
    }
  }, [
    trade,
    sendTransactionAsync,
    account,
    chainId,
    publicClient,
    swapCalls,
    t,
    allowedSlippage,
    recipientAddress,
    recipient,
    addTransaction,
    type,
    sendPaymasterTransaction,
    isPaymasterAvailable,
    isPaymasterTokenActive,
  ])
}

export const userRejectedError = (error: unknown): boolean => {
  return (
    error instanceof UserRejectedRequestError ||
    error instanceof TransactionRejectedError ||
    (typeof error !== 'string' && isUserRejected(error))
  )
}

const getSolanaProvider = async () => {
  if ('solana' in window) {
    const solanaProvider = window.solana
    // @ts-ignore
    if (solanaProvider.isPhantom) {
      return solanaProvider
    }
  } else {
    window.open('https://www.phantom.app/', '_blank')
  }
  return null
}
