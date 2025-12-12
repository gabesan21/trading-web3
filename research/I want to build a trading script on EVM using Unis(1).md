<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I want to build a trading script on EVM using Uniswap V3, between 2 tokens Research on how to make a typescript script to: - get the output token B quantity, given a token A quantity - perform the trade

Now I'll create a comprehensive TypeScript guide with complete code for building a Uniswap V3 trading script. This is clearly a Tier 1 request (educational/code snippet), so I'll provide detailed information.

## Uniswap V3 TypeScript Trading Script Guide

Here's a complete guide to build a production-ready Uniswap V3 trading script in TypeScript that gets output amounts and executes swaps.

### **Step 1: Installation \& Setup**

```bash
npm install ethers @uniswap/v3-sdk @uniswap/sdk-core dotenv
```

**Environment file (.env):**

```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
WALLET_ADDRESS=your_wallet_address
```


***

### **Step 2: Core Structure**

Create `config.ts` for token and contract definitions:

```typescript
import { Token } from '@uniswap/sdk-core';

// Example: USDC and WETH on Mainnet
export const USDC = new Token(
  1, // chainId
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // address
  6, // decimals
  'USDC',
  'USD Coin'
);

export const WETH = new Token(
  1,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether'
);

export const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
export const QUOTER_ADDRESS = '0x61fFE014bA17989E8EB3e5EB60742Db1D5476D48';
export const POOL_FEE = 3000; // 0.3% fee tier
```


***

### **Step 3: Get Quote (Token B Amount from Token A Quantity)**

Create `quoter.ts`:

```typescript
import { ethers } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { QUOTER_ADDRESS } from './config';

// Quoter ABI (simplified - includes quoteExactInputSingle)
const QUOTER_ABI = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' }
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export async function getQuote(
  provider: ethers.Provider,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string, // in smallest units (wei for 18 decimals)
  poolFee: number
): Promise<{
  amountOut: string;
  priceImpact: string;
  gasEstimate: string;
}> {
  const quoterContract = new ethers.Contract(
    QUOTER_ADDRESS,
    QUOTER_ABI,
    provider
  );

  try {
    const quote = await quoterContract.quoteExactInputSingle(
      tokenIn.address,
      tokenOut.address,
      poolFee,
      amountIn,
      0 // no price limit
    );

    return {
      amountOut: quote.amountOut.toString(),
      priceImpact: '0', // calculate if needed
      gasEstimate: quote.gasEstimate.toString()
    };
  } catch (error) {
    console.error('Quote error:', error);
    throw new Error('Failed to get quote from Uniswap V3');
  }
}

// Helper to format readable amounts
export function formatAmount(amount: string, decimals: number): string {
  return ethers.formatUnits(amount, decimals);
}

// Helper to parse readable amounts to smallest unit
export function parseAmount(amount: string, decimals: number): string {
  return ethers.parseUnits(amount, decimals).toString();
}
```


***

### **Step 4: Execute the Swap**

Create `swapper.ts`:

```typescript
import { ethers } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { SWAP_ROUTER_ADDRESS } from './config';

const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function executeSwap(
  signer: ethers.Signer,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string, // smallest units
  amountOutMinimum: string, // with slippage applied
  poolFee: number,
  slippagePercent: number = 2 // 2% slippage tolerance
): Promise<string> {
  const userAddress = await signer.getAddress();
  
  // Step 1: Approve token spending
  console.log('Approving token spending...');
  const tokenContract = new ethers.Contract(
    tokenIn.address,
    ERC20_ABI,
    signer
  );

  const approveTx = await tokenContract.approve(
    SWAP_ROUTER_ADDRESS,
    amountIn
  );
  
  const approveReceipt = await approveTx.wait();
  if (!approveReceipt || approveReceipt.status === 0) {
    throw new Error('Token approval failed');
  }
  console.log('✓ Token approval confirmed');

  // Step 2: Execute swap
  console.log('Executing swap...');
  const swapRouter = new ethers.Contract(
    SWAP_ROUTER_ADDRESS,
    SWAP_ROUTER_ABI,
    signer
  );

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  const swapParams = {
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    fee: poolFee,
    recipient: userAddress,
    deadline: deadline,
    amountIn: amountIn,
    amountOutMinimum: amountOutMinimum,
    sqrtPriceLimitX96: 0 // no price limit
  };

  const swapTx = await swapRouter.exactInputSingle(swapParams);
  const swapReceipt = await swapTx.wait();

  if (!swapReceipt || swapReceipt.status === 0) {
    throw new Error('Swap execution failed');
  }

  console.log('✓ Swap completed');
  return swapReceipt.hash;
}
```


***

### **Step 5: Main Script**

Create `index.ts`:

```typescript
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { USDC, WETH, POOL_FEE } from './config';
import { getQuote, parseAmount, formatAmount } from './quoter';
import { executeSwap } from './swapper';

dotenv.config();

async function main() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log(`Trading wallet: ${await signer.getAddress()}\n`);

  // Configuration
  const tokenAAmount = '1'; // 1 WETH
  const slippageTolerance = 2; // 2%

  // Step 1: Get quote
  console.log(`Getting quote for ${tokenAAmount} ${WETH.symbol} -> ${USDC.symbol}`);
  
  const amountInSmallestUnits = parseAmount(tokenAAmount, WETH.decimals);
  
  const quote = await getQuote(
    provider,
    WETH,
    USDC,
    amountInSmallestUnits,
    POOL_FEE
  );

  const amountOutReadable = formatAmount(quote.amountOut, USDC.decimals);
  console.log(`Expected output: ${amountOutReadable} ${USDC.symbol}\n`);

  // Step 2: Calculate minimum output with slippage
  const amountOutBigInt = BigInt(quote.amountOut);
  const slippageMultiplier = BigInt(100 - slippageTolerance) * BigInt(100); // 198 * 100
  const amountOutMinimum = (amountOutBigInt * slippageMultiplier) / BigInt(10000);

  console.log(`Slippage tolerance: ${slippageTolerance}%`);
  console.log(`Minimum output: ${formatAmount(amountOutMinimum.toString(), USDC.decimals)} ${USDC.symbol}\n`);

  // Step 3: Execute swap
  console.log('Initiating swap...\n');
  
  try {
    const txHash = await executeSwap(
      signer,
      WETH,
      USDC,
      amountInSmallestUnits,
      amountOutMinimum.toString(),
      POOL_FEE,
      slippageTolerance
    );

    console.log(`\n✅ Swap successful!`);
    console.log(`Transaction: https://etherscan.io/tx/${txHash}`);
  } catch (error) {
    console.error('❌ Swap failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
```


***

### **Step 6: Key Concepts**

| Concept | Details |
| :-- | :-- |
| **Quote** | Uses `quoteExactInputSingle` to simulate swap and get output amount without executing |
| **Approval** | Must approve the router to spend your input tokens first |
| **Slippage** | Calculate `amountOutMinimum` = `amountOut × (100 - slippage%) / 100` |
| **Deadline** | Transaction becomes invalid after this timestamp (prevents stuck transactions) |
| **Pool Fee** | 500 (0.05%), 3000 (0.3%), or 10000 (1%) depending on liquidity and token pair |


***

### **Step 7: Run the Script**

```bash
npx ts-node index.ts
```


***

### **Production Considerations**

- ✅ Add error handling and retry logic
- ✅ Monitor gas prices and adjust accordingly
- ✅ Use environment variables for sensitive data
- ✅ Add logging and monitoring
- ✅ Test on testnet first (Sepolia, Polygon Mumbai)
- ✅ Implement MEV protection if needed
- ✅ Consider multi-hop swaps for better pricing

Would you like me to expand on any specific part, such as multi-hop swaps, gas optimization, or testnet configuration?
<span style="display:none">[^1_1][^1_10][^1_2][^1_3][^1_4][^1_5][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://www.quicknode.com/guides/defi/dexs/how-to-swap-tokens-on-uniswap-v3

[^1_2]: https://docs.uniswap.org/sdk/v3/guides/swaps/quoting

[^1_3]: https://www.youtube.com/watch?v=f5Fuhm_8FjE

[^1_4]: https://stackoverflow.com/questions/74206990/uniswap-v3-router

[^1_5]: https://docs.uniswap.org/sdk/v4/guides/swaps/quoting

[^1_6]: https://techgeorgii.com/uniswap-v3-sdk-swap-tutorial-part-5-execute-a-swap/

[^1_7]: https://www.luiztools.com.br/post/como-criar-bot-trader-para-uniswap-v3-em-node-js/

[^1_8]: https://github.com/Uniswap/docs/blob/main/docs/sdk/v3/guides/swaps/01-quoting.md

[^1_9]: https://docs.uniswap.org/contracts/v3/guides/swaps/single-swaps

[^1_10]: https://github.com/Uniswap/v3-new-chain-deployments

