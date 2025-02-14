import { BigNumber } from "ethers"
import {
  Block as EthersBlock,
  TransactionRequest as EthersTransactionRequest,
} from "@ethersproject/abstract-provider"
import { Transaction as EthersTransaction } from "@ethersproject/transactions"

import {
  AnyEVMTransaction,
  EVMNetwork,
  SignedEVMTransaction,
  AnyEVMBlock,
  EIP1559TransactionRequest,
} from "../../networks"
import { FungibleAsset } from "../../assets"
import { getEthereumNetwork } from "../../lib/utils"

/**
 * Parse a block as returned by a polling provider.
 */
export function blockFromEthersBlock(gethResult: EthersBlock): AnyEVMBlock {
  return {
    hash: gethResult.hash,
    blockHeight: gethResult.number,
    parentHash: gethResult.parentHash,
    // FIXME Hold for ethers/v5.4.8 _difficulty BigNumber field; the current
    // FIXME difficutly field is a `number` and has overflowed since Ethereum
    // FIXME difficulty has exceeded MAX_SAFE_INTEGER. The current ethers
    // FIXME version devolves to `null` in that scenario, and does not reflect
    // FIXME in its type. The upcoming release will have a BigNumber
    // FIXME _difficulty field.
    difficulty: 0n,
    timestamp: gethResult.timestamp,
    baseFeePerGas: gethResult.baseFeePerGas?.toBigInt(),
    network: getEthereumNetwork(), // TODO the network should be passed as an argument to this function instead
  }
}

/**
 * Parse a block as returned by a websocket provider subscription.
 */
export function blockFromWebsocketBlock(
  incomingGethResult: unknown
): AnyEVMBlock {
  const gethResult = incomingGethResult as {
    hash: string
    number: string
    parentHash: string
    difficulty: string
    timestamp: string
    baseFeePerGas?: string
  }

  return {
    hash: gethResult.hash,
    blockHeight: BigNumber.from(gethResult.number).toNumber(),
    parentHash: gethResult.parentHash,
    difficulty: BigInt(gethResult.difficulty),
    timestamp: BigNumber.from(gethResult.timestamp).toNumber(),
    baseFeePerGas: gethResult.baseFeePerGas
      ? BigInt(gethResult.baseFeePerGas)
      : undefined,
    network: getEthereumNetwork(), // TODO the network should be passed as an argument to this function instead
  }
}

export function ethersTransactionRequestFromEIP1559TransactionRequest(
  transaction: EIP1559TransactionRequest
): EthersTransactionRequest {
  return {
    to: transaction.to,
    data: transaction.input ?? undefined,
    from: transaction.from,
    type: transaction.type,
    nonce: transaction.nonce,
    value: transaction.value,
    chainId: parseInt(transaction.chainID, 10),
    gasLimit: transaction.gasLimit,
    maxFeePerGas: transaction.maxFeePerGas,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
  }
}

export function eip1559TransactionRequestFromEthersTransactionRequest(
  transaction: EthersTransactionRequest
): Partial<EIP1559TransactionRequest> {
  // TODO What to do if transaction is not EIP1559?
  return {
    to: transaction.to,
    input: transaction.data?.toString() ?? null,
    from: transaction.from,
    type: transaction.type as 1 | 2,
    nonce:
      typeof transaction.nonce !== "undefined"
        ? parseInt(transaction.nonce.toString(), 16)
        : undefined,
    value:
      typeof transaction.value !== "undefined"
        ? BigInt(transaction.value.toString())
        : undefined,
    chainID: transaction.chainId?.toString(16),
    gasLimit:
      typeof transaction.gasLimit !== "undefined"
        ? BigInt(transaction.gasLimit.toString())
        : undefined,
    maxFeePerGas:
      typeof transaction.maxFeePerGas !== "undefined"
        ? BigInt(transaction.maxFeePerGas.toString())
        : undefined,
    maxPriorityFeePerGas:
      typeof transaction.maxPriorityFeePerGas !== "undefined"
        ? BigInt(transaction.maxPriorityFeePerGas.toString())
        : undefined,
  }
}

export function ethersTxFromSignedTx(
  tx: SignedEVMTransaction
): EthersTransaction {
  const baseTx = {
    nonce: Number(tx.nonce),
    maxFeePerGas: tx.maxFeePerGas ? BigNumber.from(tx.maxFeePerGas) : undefined,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas
      ? BigNumber.from(tx.maxPriorityFeePerGas)
      : undefined,
    to: tx.to,
    from: tx.from,
    data: tx.input || "",
    type: tx.type,
    chainId: parseInt(tx.network.chainID, 10),
    value: BigNumber.from(tx.value),
    gasLimit: BigNumber.from(tx.gasLimit),
  }

  return {
    ...baseTx,
    r: tx.r,
    s: tx.s,
    v: tx.v,
  }
}

/**
 * Parse a transaction as returned by a websocket provider subscription.
 */
export function txFromWebsocketTx(
  websocketTx: unknown,
  asset: FungibleAsset,
  network: EVMNetwork
): AnyEVMTransaction {
  // These are the props we expect here.
  const tx = websocketTx as {
    hash: string
    to: string
    from: string
    gas: string
    gasPrice: string
    maxFeePerGas: string | undefined | null
    maxPriorityFeePerGas: string | undefined | null
    input: string
    r: string
    s: string
    v: string
    nonce: string
    value: string
    blockHash: string | undefined | null
    blockHeight: string | undefined | null
    blockNumber: number | undefined | null
    type: string | undefined | null
  }

  return {
    hash: tx.hash,
    to: tx.to,
    from: tx.from,
    gasLimit: BigInt(tx.gas),
    gasPrice: BigInt(tx.gasPrice),
    maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : null,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas
      ? BigInt(tx.maxPriorityFeePerGas)
      : null,
    input: tx.input,
    r: tx.r || undefined,
    s: tx.s || undefined,
    v: BigNumber.from(tx.v).toNumber(),
    nonce: Number(tx.nonce),
    value: BigInt(tx.value),
    blockHash: tx.blockHash ?? null,
    blockHeight: tx.blockNumber ?? null,
    type:
      tx.type !== undefined
        ? (BigNumber.from(tx.type).toNumber() as AnyEVMTransaction["type"])
        : 0,
    asset,
    network,
  }
}

/**
 * Parse a transaction as returned by a polling provider.
 */
export function txFromEthersTx(
  tx: EthersTransaction & {
    from: string
    blockHash?: string
    blockNumber?: number
    type?: number | null
  },
  asset: FungibleAsset,
  network: EVMNetwork
): AnyEVMTransaction {
  if (tx.hash === undefined) {
    throw Error("Malformed transaction")
  }
  if (tx.type !== 0 && tx.type !== 1 && tx.type !== 2) {
    throw Error(`Unknown transaction type ${tx.type}`)
  }

  const newTx = {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    nonce: parseInt(tx.nonce.toString(), 10),
    gasLimit: tx.gasLimit.toBigInt(),
    gasPrice: tx.gasPrice ? tx.gasPrice.toBigInt() : null,
    maxFeePerGas: tx.maxFeePerGas ? tx.maxFeePerGas.toBigInt() : null,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas
      ? tx.maxPriorityFeePerGas.toBigInt()
      : null,
    value: tx.value.toBigInt(),
    input: tx.data,
    type: tx.type,
    blockHash: tx.blockHash || null,
    blockHeight: tx.blockNumber || null,
    network,
    asset,
  } as const // narrow types for compatiblity with our internal ones

  if (tx.r && tx.s && tx.v) {
    const signedTx: SignedEVMTransaction = {
      ...newTx,
      r: tx.r,
      s: tx.s,
      v: tx.v,
    }
    return signedTx
  }
  return newTx
}
