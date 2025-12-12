<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I want to build a trading script on EVM using Uniswap V4, between 2 tokens

Research on how to make a typescript script to:

- get the output token B quantity, given a token A quantity
- perform the trade

Perfect! Now I have comprehensive information to provide you with a detailed guide. Let me create a complete TypeScript trading script for Uniswap V4.

## Building a Uniswap V4 Trading Script in TypeScript

Based on my research, here's a comprehensive guide to building a trading script that gets output amounts and executes swaps on Uniswap V4:[^1_1][^1_2]

### **Architecture Overview**

Your script will have two main components:

1. **Quote/Simulation** - Calculate token B output given token A input
2. **Swap Execution** - Execute the actual trade on-chain

### **Key Differences from V3**

Uniswap V4 introduces:

- **Singleton architecture** - One pool manager for all pools
- **Flash accounting** - Net balances settled once per transaction (saves gas)
- **PoolKey structure** - Identifies pools with token pair + fee + hook + tickSpacing
- **Quoter contract** - For off-chain simulation of output amounts[^1_2]

***

## **Step 1: Installation \& Setup**

```bash
npm install @uniswap/v4-sdk @uniswap/sdk-core @uniswap/universal-router ethers dotenv
npm install --save-dev typescript @types/node ts-node
```

**Create `.env`:**

```env
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
TOKEN_A_ADDRESS=0x...
TOKEN_B_ADDRESS=0x...
POOL_FEE=3000  # 0.3%, can be 500, 3000, 10000
```


***

## **Step 2: Define Pool Configuration**

```typescript
// config.ts
import { Token, ChainId } from '@uniswap/sdk-core'

const CHAIN_ID = ChainId.MAINNET

// Example: ETH and USDC
export const TOKEN_A = new Token(
  CHAIN_ID,
  process.env.TOKEN_A_ADDRESS!,
  18, // decimals for ETH
  'ETH',
  'Ethereum'
)

export const TOKEN_B = new Token(
  CHAIN_ID,
  process.env.TOKEN_B_ADDRESS!,
  6, // decimals for USDC
  'USDC',
  'USD Coin'
)

export const POOL_FEE = parseInt(process.env.POOL_FEE!) // e.g., 3000 = 0.3%

// PoolKey uniquely identifies a pool
export const POOL_KEY = {
  currency0: TOKEN_A.address.toLowerCase() < TOKEN_B.address.toLowerCase() 
    ? TOKEN_A.address 
    : TOKEN_B.address,
  currency1: TOKEN_A.address.toLowerCase() > TOKEN_B.address.toLowerCase() 
    ? TOKEN_A.address 
    : TOKEN_B.address,
  fee: POOL_FEE,
  tickSpacing: 60, // depends on fee tier
  hooks: '0x0000000000000000000000000000000000000000' // no hooks
}

// zeroForOne: swap from currency0 to currency1 (true) or vice versa (false)
export const ZERO_FOR_ONE = TOKEN_A.address.toLowerCase() < TOKEN_B.address.toLowerCase()
```


***

## **Step 3: Get Quote (Calculate Output Amount)**

```typescript
// quote.ts
import { ethers } from 'ethers'
import { parseUnits, formatUnits } from 'ethers'
import { POOL_KEY, TOKEN_A, TOKEN_B, ZERO_FOR_ONE } from './config'

// Quoter contract address (mainnet)
const QUOTER_ADDRESS = '0x0000000000000000000000000000000000000000' // Get from Uniswap deployments

// Quoter ABI (simplified)
const QUOTER_ABI = [
  {
    inputs: [
      { name: 'poolKey', type: 'tuple', components: [
        { name: 'currency0', type: 'address' },
        { name: 'currency1', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
        { name: 'hooks', type: 'address' }
      ]},
      { name: 'zeroForOne', type: 'bool' },
      { name: 'exactAmount', type: 'uint256' },
      { name: 'hookData', type: 'bytes' }
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

export async function getOutputAmount(
  amountIn: string,
  provider: ethers.Provider
): Promise<{
  amountOut: string
  amountOutFormatted: string
  gasEstimate: string
}> {
  try {
    const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider)

    // Convert input amount to wei
    const amountInWei = parseUnits(amountIn, TOKEN_A.decimals)

    // Call quoter contract (uses callStatic for simulation)
    const result = await quoter.quoteExactInputSingle.staticCall({
      poolKey: POOL_KEY,
      zeroForOne: ZERO_FOR_ONE,
      exactAmount: amountInWei,
      hookData: '0x'
    })

    const amountOutFormatted = formatUnits(result.amountOut, TOKEN_B.decimals)

    console.log(`Input: ${amountIn} ${TOKEN_A.symbol}`)
    console.log(`Output: ${amountOutFormatted} ${TOKEN_B.symbol}`)
    console.log(`Gas Estimate: ${result.gasEstimate.toString()}`)

    return {
      amountOut: result.amountOut.toString(),
      amountOutFormatted,
      gasEstimate: result.gasEstimate.toString()
    }
  } catch (error) {
    console.error('Quote error:', error)
    throw error
  }
}
```


***

## **Step 4: Execute the Swap**

```typescript
// swap.ts
import { ethers } from 'ethers'
import { parseUnits } from 'ethers'
import { POOL_KEY, TOKEN_A, TOKEN_B, ZERO_FOR_ONE } from './config'

// Universal Router address (mainnet)
const UNIVERSAL_ROUTER = '0x0000000000000000000000000000000000000000'

// Actions enum
enum Actions {
  SWAP_EXACT_IN_SINGLE = 0,
  SETTLE_ALL = 15,
  TAKE_ALL = 18
}

// Universal Router ABI (simplified)
const ROUTER_ABI = [
  {
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }
]

export interface SwapParams {
  amountIn: string
  minAmountOut: string // slippage protection (usually amountOut * 0.99 for 1%)
  recipient: string
  deadline?: number
}

export async function executeSwap(
  params: SwapParams,
  signer: ethers.Signer
): Promise<{
  hash: string
  receipt: ethers.TransactionReceipt | null
}> {
  try {
    const router = new ethers.Contract(UNIVERSAL_ROUTER, ROUTER_ABI, signer)

    // Set deadline to 10 minutes from now
    const deadline = params.deadline || Math.floor(Date.now() / 1000) + 600

    const amountInWei = parseUnits(params.amountIn, TOKEN_A.decimals)
    const minAmountOutWei = parseUnits(params.minAmountOut, TOKEN_B.decimals)

    // Encode swap action
    const swapExactInParams = [
      POOL_KEY,
      ZERO_FOR_ONE,
      amountInWei,
      minAmountOutWei
    ]

    const swapExactInEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ['tuple(address,address,uint24,int24,address)', 'bool', 'uint256', 'uint256'],
      swapExactInParams
    )

    // Encode settle action (pays back input token)
    const settleEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'bool'],
      [TOKEN_A.address, params.recipient, true]
    )

    // Encode take action (receives output token)
    const takeEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256', 'address'],
      [TOKEN_B.address, params.recipient, minAmountOutWei, params.recipient]
    )

    // Create commands and inputs arrays
    const commands = ethers.solidityPacked(
      ['uint8', 'uint8', 'uint8'],
      [Actions.SWAP_EXACT_IN_SINGLE, Actions.SETTLE_ALL, Actions.TAKE_ALL]
    )

    const inputs = [swapExactInEncoded, settleEncoded, takeEncoded]

    // Approve token before swap (if not ETH)
    const tokenContract = new ethers.Contract(
      TOKEN_A.address,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      signer
    )

    const approveTx = await tokenContract.approve(UNIVERSAL_ROUTER, amountInWei)
    await approveTx.wait()
    console.log(`Approved ${params.amountIn} ${TOKEN_A.symbol}`)

    // Execute swap
    const tx = await router.execute(commands, inputs, deadline, {
      gasLimit: 300000
    })

    console.log(`Swap transaction sent: ${tx.hash}`)

    // Wait for confirmation
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt?.blockNumber}`)

    return {
      hash: tx.hash,
      receipt
    }
  } catch (error) {
    console.error('Swap execution error:', error)
    throw error
  }
}
```


***

## **Step 5: Complete Trading Script**

```typescript
// main.ts
import { ethers } from 'ethers'
import dotenv from 'dotenv'
import { getOutputAmount } from './quote'
import { executeSwap, SwapParams } from './swap'

dotenv.config()

async function main() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

  const amountIn = '1.0' // 1 ETH
  const slippageTolerance = 0.01 // 1%

  try {
    console.log('=== UNISWAP V4 SWAP SCRIPT ===\n')

    // Step 1: Get quote
    console.log('Step 1: Getting quote...')
    const quote = await getOutputAmount(amountIn, provider)
    
    // Step 2: Calculate minimum output with slippage
    const amountOutNum = parseFloat(quote.amountOutFormatted)
    const minAmountOut = (amountOutNum * (1 - slippageTolerance)).toString()

    console.log(`\nStep 2: Slippage tolerance: ${slippageTolerance * 100}%`)
    console.log(`Minimum output: ${minAmountOut}\n`)

    // Step 3: Execute swap
    console.log('Step 3: Executing swap...')
    const result = await executeSwap(
      {
        amountIn,
        minAmountOut,
        recipient: signer.address
      },
      signer
    )

    console.log(`\n✅ Swap completed!`)
    console.log(`Transaction: ${result.hash}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
```


***

## **Key Concepts Explained**

| Concept | Description |
| :-- | :-- |
| **PoolKey** | Tuple of (token0, token1, fee, tickSpacing, hooks) - uniquely identifies a pool |
| **zeroForOne** | Direction of swap: true if swapping token0→token1, false for token1→token0 |
| **Flash Accounting** | V4 tracks net deltas per transaction instead of immediate transfers (saves gas) |
| **Quoter** | Contract that simulates swaps without executing them |
| **Universal Router** | Executes multi-step actions (swap → settle → take) in one transaction |
| **Slippage** | Price difference protection; calculate `minAmountOut = amountOut * (1 - slippage)` |
| **Deadline** | Transaction expiration time (usually current time + 10 minutes) |


***

## **Testing on Testnet**

Use Sepolia (ETH test network):

- Update `CHAIN_ID` to `ChainId.SEPOLIA`
- Get testnet RPC from Alchemy/Infura
- Obtain testnet tokens from faucets
- Find pool addresses on Uniswap V4 docs/deployments page

***

## **Important Notes**

⚠️ **Security:**

- Never hardcode private keys in production
- Use environment variables or hardware wallets
- Test on testnet first
- Verify contract addresses match official Uniswap deployments

⚠️ **Gas Optimization:**

- V4 is more gas-efficient than V3 due to singleton + flash accounting
- Estimate 150k-300k gas for typical swaps
- Current fee structure: 500, 3000, or 10000 pips

⚠️ **Slippage:**

- Always set reasonable slippage (0.1%-2%)
- Monitor mempool for MEV protection
- Use private RPCs if trading high volumes[^1_3]

Would you like me to expand on any specific part, such as handling multi-hop swaps, advanced routing, or deploying custom hooks?
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_4][^1_5][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://soliditydeveloper.com/uniswap4

[^1_2]: https://docs.uniswap.org/sdk/v4/guides/swaps/quoting

[^1_3]: https://www.quillaudits.com/research/uniswap-development/uniswap-v4/swap-mechanics-in-uniswap-v4-core

[^1_4]: https://docs.uniswap.org/contracts/v4/guides/custom-accounting

[^1_5]: https://app.unpkg.com/@uniswap/v4-sdk@1.12.3/files/dist/v4-sdk.esm.js.map

[^1_6]: https://www.youtube.com/watch?v=myxGCAmd37k

[^1_7]: https://docs.uniswap.org/sdk/v3/guides/swaps/trading

[^1_8]: https://www.quicknode.com/guides/defi/dexs/how-to-create-uniswap-v4-hooks

[^1_9]: https://www.cyfrin.io/blog/uniswap-v4-swap-deep-dive-into-execution-and-accounting

[^1_10]: https://github.com/shuhuiluo/uniswap-v4-sdk-rs

[^1_11]: https://hedge3.org/academy/guides/uniswap-v4-hooks-explained/

[^1_12]: https://docs.uniswap.org/contracts/v4/quickstart/swap

[^1_13]: https://github.com/Uniswap/router-sdk/blob/main/src/swapRouter.ts

[^1_14]: https://stackoverflow.com/questions/72226238/understanding-typescript-code-example-based-on-uniswap-code

[^1_15]: https://docs.uniswap.org/contracts/v4/guides/swap-routing

[^1_16]: https://www.youtube.com/watch?v=Ve8Kp7hFES8

[^1_17]: https://docs.uniswap.org/sdk/v4/reference/classes/Trade

[^1_18]: https://github.com/Uniswap/docs/blob/main/docs/sdk/v3/guides/swaps/03-routing.md

[^1_19]: https://www.reddit.com/r/UniSwap/comments/wb18h4/uniswap_tutorial_for_developers_swap_with_v3_sdk/

[^1_20]: https://docs.uniswap.org/sdk/v3/guides/swaps/quoting

[^1_21]: https://docs.uniswap.org/contracts/v2/concepts/advanced-topics/pricing

[^1_22]: https://www.sec.gov/files/ctf-written-input-mohamed-elbendary-052025-2.pdf

[^1_23]: https://www.quicknode.com/guides/defi/dexs/how-to-swap-tokens-on-uniswap-v3

[^1_24]: https://threesigma.xyz/blog/defi/uniswap-v4-features-dynamic-fees-hooks-gas-saving

[^1_25]: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/quote.ts

[^1_26]: https://www.openzeppelin.com/news/uniswap-v4-periphery-and-universal-router-audit

[^1_27]: https://github.com/Uniswap/sdk-core

