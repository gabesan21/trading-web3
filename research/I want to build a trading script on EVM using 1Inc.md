<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I want to build a trading script on EVM using 1Inch, between 2 tokens

Research on how to make a typescript script to:

- get the output token B quantity, given a token A quantity
- perform the trade

Perfect! Now I have comprehensive information. This is a **Tier 1 query** - the user is asking for educational guidance on how to build a trading script, which is clearly explanation/tutorial intent. They're not asking me to build it for them - they want to understand HOW to do it themselves.

## How to Build a 1Inch Trading Script on EVM with TypeScript

Here's a comprehensive guide for building a TypeScript script that gets quotes and executes trades using the 1Inch aggregator API.[^1_1][^1_2]

### Architecture Overview

The 1Inch API works in two steps:[^1_3]

1. **Quote Phase**: Get the best swap rate and routing information
2. **Swap Phase**: Receive transaction data to execute on-chain

***

### Step 1: Get Output Token Quantity (Quote)

**API Endpoint**: `/api/v5.0/{chainId}/quote`

The quote endpoint calculates how many tokens B you'll receive for a given amount of tokens A.

```typescript
import axios from 'axios';

interface QuoteParams {
  src: string;           // Token A contract address
  dst: string;           // Token B contract address
  amount: string;        // Amount in minimal divisible units (wei)
  includeTokensInfo?: boolean;
  includeProtocols?: boolean;
  includeGas?: boolean;
}

async function getQuote(chainId: number, params: QuoteParams) {
  const baseUrl = `https://api.1inch.io/v5.0/${chainId}/quote`;
  
  try {
    const response = await axios.get(baseUrl, { params });
    
    return {
      tokenA: params.src,
      tokenB: params.dst,
      tokenAAmount: params.amount,
      tokenBAmount: response.data.toAmount,        // ← OUTPUT QUANTITY
      protocols: response.data.protocols,           // Routes used
      gas: response.data.gas                        // Gas estimate
    };
  } catch (error) {
    console.error('Quote failed:', error);
    throw error;
  }
}

// Usage Example
const quote = await getQuote(1, {
  src: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on Ethereum
  dst: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
  amount: '1000000000000000000',                     // 1 WETH (18 decimals)
  includeTokensInfo: true,
  includeGas: true
});

console.log(`You will receive: ${quote.tokenBAmount} USDC`);
```

**Key Parameters**:[^1_2]


| Parameter | Purpose |
| :-- | :-- |
| `src` | Token A address (what you're selling) |
| `dst` | Token B address (what you're buying) |
| `amount` | Input amount in minimal divisible units (wei) |
| `includeGas` | Include gas estimate in response |
| `gasPrice` | Optional - specify network gas price (wei) |
| `slippage` | NOT in quote - used in swap call instead |


***

### Step 2: Execute the Swap

**API Endpoint**: `/api/v5.0/{chainId}/swap`

The swap endpoint returns encoded transaction data that you send to the 1Inch router contract.

```typescript
import { ethers } from 'ethers';

interface SwapParams {
  src: string;           // Token A address
  dst: string;           // Token B address
  amount: string;        // Input amount in wei
  from: string;          // Your wallet address
  slippage: number;      // 0.1 = 0.1% max slippage
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
}

async function getSwapData(chainId: number, params: SwapParams) {
  const baseUrl = `https://api.1inch.io/v5.0/${chainId}/swap`;
  
  try {
    const response = await axios.get(baseUrl, {
      params: {
        src: params.src,
        dst: params.dst,
        amount: params.amount,
        from: params.from,
        slippage: params.slippage,
        disableEstimate: params.disableEstimate ?? false,
        allowPartialFill: params.allowPartialFill ?? true
      }
    });

    return response.data.tx;  // Transaction data
  } catch (error) {
    console.error('Swap data fetch failed:', error);
    throw error;
  }
}

async function executeSwap(
  chainId: number,
  privateKey: string,
  rpcUrl: string,
  swapParams: SwapParams
) {
  // 1. Get swap transaction data from 1Inch
  const txData = await getSwapData(chainId, swapParams);

  // 2. Setup provider and signer
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  // 3. Prepare transaction
  const tx = {
    to: txData.to,                    // 1Inch router contract
    from: signer.address,
    data: txData.data,                // Encoded swap instructions
    value: txData.value,              // ETH value (if swapping from native token)
    gasPrice: ethers.parseUnits(
      txData.gasPrice || '20', 
      'gwei'
    ),
    gasLimit: ethers.toBeHex(txData.gas || 500000)
  };

  // 4. Execute transaction
  try {
    const sentTx = await signer.sendTransaction(tx);
    console.log('Transaction sent:', sentTx.hash);

    // 5. Wait for confirmation
    const receipt = await sentTx.wait();
    console.log('Transaction confirmed in block:', receipt?.blockNumber);
    
    return receipt;
  } catch (error) {
    console.error('Swap execution failed:', error);
    throw error;
  }
}
```


***

### Complete Working Script

Here's a complete end-to-end example:

```typescript
import axios from 'axios';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CHAIN_ID = 1;  // Ethereum mainnet
const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

// Token addresses (Ethereum mainnet)
const TOKENS = {
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI:  '0x6B175474E89094C44Da98b954EedeAC495271d0F'
};

async function swapTokens(
  tokenAAddress: string,
  tokenBAddress: string,
  amountInWei: string,
  maxSlippage: number = 0.5
) {
  try {
    // Step 1: Get quote
    console.log('📊 Fetching quote...');
    const quoteResponse = await axios.get(
      `https://api.1inch.io/v5.0/${CHAIN_ID}/quote`,
      {
        params: {
          src: tokenAAddress,
          dst: tokenBAddress,
          amount: amountInWei,
          includeGas: true
        }
      }
    );

    const { toAmount, gas } = quoteResponse.data;
    console.log(`✅ Quote received: ${toAmount} tokens out`);
    console.log(`⛽ Estimated gas: ${gas}`);

    // Step 2: Get swap transaction data
    console.log('\n📝 Building swap transaction...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const swapResponse = await axios.get(
      `https://api.1inch.io/v5.0/${CHAIN_ID}/swap`,
      {
        params: {
          src: tokenAAddress,
          dst: tokenBAddress,
          amount: amountInWei,
          from: signer.address,
          slippage: maxSlippage,
          disableEstimate: false
        }
      }
    );

    const { tx } = swapResponse.data;

    // Step 3: Execute swap
    console.log('🚀 Executing swap...');
    const transaction = await signer.sendTransaction({
      to: tx.to,
      from: tx.from,
      data: tx.data,
      value: tx.value,
      gasLimit: ethers.toBeHex(tx.gas),
      gasPrice: ethers.toBeHex(tx.gasPrice)
    });

    console.log(`\n✨ Transaction sent: ${transaction.hash}`);

    // Step 4: Wait for confirmation
    const receipt = await transaction.wait();
    console.log(`✅ Confirmed in block: ${receipt?.blockNumber}`);
    console.log(`💰 Transaction succeeded!`);

  } catch (error) {
    console.error('❌ Swap failed:', error);
    throw error;
  }
}

// Run example: Swap 1 WETH for USDC
(async () => {
  const oneWethInWei = ethers.parseUnits('1', 18);
  
  await swapTokens(
    TOKENS.WETH,
    TOKENS.USDC,
    oneWethInWei.toString(),
    0.5  // 0.5% max slippage
  );
})();
```


***

### Key Concepts

**Minimal Divisible Units**:[^1_1]

- All amounts must be in the smallest unit of the token (wei for 18-decimal tokens)
- Example: 1 WETH with 18 decimals = `1000000000000000000`
- For USDC (6 decimals): 100 USDC = `100000000`

**Slippage**:[^1_1]

- Specify in the `/swap` endpoint (not quote)
- Percentage of input token amount you're willing to lose
- Typical range: 0.1% - 1%

**Transaction Data**:

- The `tx.data` field contains encoded function calls to the 1Inch router
- It's fully self-contained - just send it to the contract address

**Gas Considerations**:

- Use gas estimates from `/quote` as rough guides only
- Always include `gasLimit` in your transaction (don't rely on estimation)
- Set `gasPrice` appropriately for network conditions

***

### Setup Steps

1. **Install dependencies**:
```bash
npm install ethers axios dotenv
npm install --save-dev typescript @types/node
```

2. **Create `.env` file**:
```
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key_here
```

3. **Run the script**:
```bash
npx ts-node script.ts
```


***

### Useful Chain IDs

| Network | Chain ID |
| :-- | :-- |
| Ethereum | 1 |
| Polygon | 137 |
| BSC | 56 |
| Arbitrum | 42161 |
| Optimism | 10 |


***

### Alternative: Using 1Inch SDK

If you prefer a higher-level SDK, 1Inch also provides:

- **Fusion SDK** for intent-based (gasless) swaps: `npm install @1inch/fusion-sdk`
- **Classic aggregation** for immediate swaps (what we covered above)

The API approach shown here is the most straightforward for programmatic swaps and gives you full control over transaction parameters.
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_4][^1_5][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://www.youtube.com/watch?v=yKV5ae2CR1s

[^1_2]: https://docs.1inch.io/docs/aggregation-protocol/api/quote-params/

[^1_3]: https://beincrypto.com/learn/1inch-swap-guide/

[^1_4]: https://www.youtube.com/watch?v=a2UHUW-xRq4

[^1_5]: https://www.youtube.com/watch?v=Cm4SZO0Hw9Q

[^1_6]: https://help.1inch.io/en/articles/4585059-what-do-i-need-to-start-swapping-on-1inch

[^1_7]: https://github.com/topics/1inch?l=typescript\&o=desc\&s=forks

[^1_8]: https://komodoplatform.com/en/docs/komodo-defi-framework/api/v20-dev/one_inch_v6_0_classic_swap_quote/

[^1_9]: https://www.youtube.com/watch?v=Ts8cUn5534Y

[^1_10]: https://blog.1inch.com/projects-that-integrated-1inch-apis/

[^1_11]: https://forum.openzeppelin.com/t/how-is-the-data-parameter-constructed-in-the-swap-function-of-1inch-aggregationrouterv5/34995

[^1_12]: https://blog.1inch.com/1inchs-swap-api-for-binance-smart-chain/

[^1_13]: https://www.quicknode.com/guides/defi/dexs/how-to-swap-tokens-on-uniswap-with-ethersjs

[^1_14]: https://www.reddit.com/r/ethdev/comments/1b6sovm/using_1inch_aggregator_v5_in_a_smart_contract/

[^1_15]: https://www.youtube.com/watch?v=FoQPUQIsxNo

[^1_16]: https://www.npmjs.com/package/@1inch/fusion-sdk

[^1_17]: https://polygonscan.com/address/0x1111111254EEB25477B68fb85Ed929f73A960582

[^1_18]: https://community.metamask.io/t/i-dont-get-the-right-transaction-data-back-using-the-ethers-api-in-combination-with-1inch/22369

[^1_19]: https://komodoplatform.com/en/docs/komodo-defi-framework/api/v20-dev/one_inch_v6_0_classic_swap_liquidity_sources/


---

# But for this tutorial to work, I need to approve my tokens to a certain contract. Where do I get this contract?

Perfect! Now I have all the information needed. Let me create a comprehensive answer about the approval contract.

## Token Approval for 1Inch Swaps

The contract you need to approve tokens to is the **1Inch Aggregation Router contract** on your respective blockchain.[^2_1]

### Router Contract Addresses by Network

Use these addresses to approve your tokens:


| Network | Router Address | Version |
| :-- | :-- | :-- |
| Ethereum | `0x1111111254eeb25477b68fb85ed929f73a960582` | V5 |
| Polygon | `0x1111111254EEB25477B68fb85Ed929f73A960582` | V5 |
| Binance Smart Chain | `0x1111111254eeb25477b68fb85ed929f73a960582` | V5 |
| Arbitrum | `0x1111111254eeb25477b68fb85ed929f73a960582` | V5 |
| Optimism | `0x1111111254eeb25477b68fb85ed929f73a960582` | V5 |
| Base | `0x1111111254eeb25477b68fb85ed929f73a960582` | V5 |

**Note:** The address is the same across most EVM chains (a pattern by design).

***

### How the Approval Process Works

When you approve tokens, you're giving the 1Inch router contract **permission to spend a specific amount of tokens on your behalf**. This is necessary because of how smart contracts work on blockchain—they cannot access your tokens without explicit permission.[^2_2]

The approval process happens in **two steps**:[^2_2]

1. **Approve transaction** - You approve the token for the router contract (small gas fee)
2. **Swap transaction** - You execute the swap using the approved tokens (larger gas fee)

Once approved, you don't need to approve the same token again for the same contract.

***

### Implementation: Add Approval to Your Script

Here's how to add token approval to your TypeScript script:

```typescript
import { ethers } from 'ethers';
import axios from 'axios';

const ROUTER_ADDRESS = '0x1111111254eeb25477b68fb85ed929f73a960582'; // V5 Router
const CHAIN_ID = 1; // Ethereum

// ERC20 ABI - only need the approve function
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)'
];

async function approveToken(
  provider: ethers.Provider,
  signer: ethers.Signer,
  tokenAddress: string,
  amountToApprove: string
): Promise<ethers.ContractTransactionResponse | null> {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    console.log(`💰 Approving ${amountToApprove} tokens...`);
    
    const approveTx = await contract.approve(ROUTER_ADDRESS, amountToApprove);
    console.log(`⏳ Approval tx sent: ${approveTx.hash}`);
    
    const receipt = await approveTx.wait();
    console.log(`✅ Token approved! Confirmed in block: ${receipt?.blockNumber}`);
    
    return approveTx;
  } catch (error) {
    console.error('❌ Approval failed:', error);
    throw error;
  }
}

async function checkAllowance(
  provider: ethers.Provider,
  tokenAddress: string,
  ownerAddress: string
): Promise<bigint> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const allowance = await contract.allowance(ownerAddress, ROUTER_ADDRESS);
  return allowance;
}

async function swapWithApproval(
  rpcUrl: string,
  privateKey: string,
  tokenAAddress: string,
  tokenBAddress: string,
  amountInWei: string,
  maxSlippage: number = 0.5
) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  
  const userAddress = signer.address;

  // Step 1: Check current allowance
  console.log('\n🔍 Checking token allowance...');
  const currentAllowance = await checkAllowance(
    provider,
    tokenAAddress,
    userAddress
  );

  const amountBigInt = ethers.getBigInt(amountInWei);

  // Step 2: Approve if needed
  if (currentAllowance < amountBigInt) {
    console.log(`⚠️  Allowance too low. Current: ${currentAllowance}, Needed: ${amountInWei}`);
    
    // Approve with infinite amount (or specific amount)
    await approveToken(provider, signer, tokenAAddress, ethers.MaxUint256.toString());
    
    // Wait a bit for approval to be indexed
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log(`✅ Token already approved!`);
  }

  // Step 3: Get swap quote
  console.log('\n📊 Fetching quote...');
  const quoteResponse = await axios.get(
    `https://api.1inch.io/v5.0/${CHAIN_ID}/quote`,
    {
      params: {
        src: tokenAAddress,
        dst: tokenBAddress,
        amount: amountInWei,
        includeGas: true
      }
    }
  );

  const { toAmount, gas } = quoteResponse.data;
  console.log(`✅ Quote: You'll receive ${toAmount} tokens`);
  console.log(`⛽ Gas estimate: ${gas}`);

  // Step 4: Get swap transaction data
  console.log('\n📝 Building swap transaction...');
  const swapResponse = await axios.get(
    `https://api.1inch.io/v5.0/${CHAIN_ID}/swap`,
    {
      params: {
        src: tokenAAddress,
        dst: tokenBAddress,
        amount: amountInWei,
        from: userAddress,
        slippage: maxSlippage,
        disableEstimate: false
      }
    }
  );

  const { tx } = swapResponse.data;

  // Step 5: Execute swap
  console.log('🚀 Executing swap...');
  const transaction = await signer.sendTransaction({
    to: tx.to,
    from: tx.from,
    data: tx.data,
    value: tx.value,
    gasLimit: ethers.toBeHex(tx.gas),
    gasPrice: ethers.toBeHex(tx.gasPrice)
  });

  console.log(`\n✨ Transaction sent: ${transaction.hash}`);
  const receipt = await transaction.wait();
  console.log(`✅ Swap confirmed in block: ${receipt?.blockNumber}`);
  
  return receipt;
}

// Usage
swapWithApproval(
  'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
  'your_private_key',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  ethers.parseUnits('1', 18).toString(),
  0.5
);
```


***

### Key Points

**Approval Amount:**[^2_1]

- You can approve a **specific amount** (exact tokens you want to swap)
- Or approve **unlimited** (`ethers.MaxUint256`) to avoid repeated approvals

**Approval Persistence:**
Once a token is approved to the router contract, you won't need to approve it again for future swaps. The allowance persists until you revoke it.

**Permit Tokens:**
Some tokens (like Uniswap, Aave) support "Permit 712", which allows **free gasless approvals** bundled with the swap. The 1Inch API handles this automatically if available.

**Network-Specific Notes:**
The router address is consistent across all major EVM chains, but always double-check on the appropriate block explorer (Etherscan, Polygonscan, Arbiscan, etc.) for the network you're using.
<span style="display:none">[^2_10][^2_11][^2_12][^2_13][^2_14][^2_15][^2_16][^2_17][^2_18][^2_19][^2_3][^2_4][^2_5][^2_6][^2_7][^2_8][^2_9]</span>

<div align="center">⁂</div>

[^2_1]: https://www.youtube.com/watch?v=yKV5ae2CR1s

[^2_2]: https://docs.1inch.io/docs/aggregation-protocol/api/quote-params/

[^2_3]: https://etherscan.io/address/1inch.eth

[^2_4]: https://basescan.org/address/0x1111111254eeb25477b68fb85ed929f73a960582

[^2_5]: https://help.1inch.io/en/articles/4585113-why-do-i-need-to-approve-my-tokens-before-a-trade

[^2_6]: https://arbiscan.io/address/0x111111125421ca6dc452d289314280a0f8842a65

[^2_7]: https://etherscan.io/address/0x2761a575cf6ea58d9d59426f1733df573d92cf36

[^2_8]: https://stackoverflow.com/questions/67760487/erc-20-approve-spending-tokens

[^2_9]: https://polygonscan.com/address/0x1111111254EEB25477B68fb85Ed929f73A960582

[^2_10]: https://basescan.org/address/0xe37e799d5077682fa0a244d46e5649f71457bd09

[^2_11]: https://help.1inch.io/en/articles/4585153-how-to-use-the-classic-swap-on-1inch

[^2_12]: https://etherscan.io/address/0x11111112542d85b3ef69ae05771c2dccff4faa26

[^2_13]: https://etherscan.io/address/0x1111111254eeb25477b68fb85ed929f73a960582

[^2_14]: https://arbiscan.io/address/0x1111111254eeb25477b68fb85ed929f73a960582

[^2_15]: https://etherscan.io/txs?a=0x1111111254eeb25477b68fb85ed929f73a960582

[^2_16]: https://polygonscan.com/address/0x11111112542d85b3ef69ae05771c2dccff4faa26

[^2_17]: https://blockscan.com/tx/0x344866f2aed53171bc0e7f19fccd813d8a1f535973f400e6546a8bd4144e9ff7

[^2_18]: https://etherscan.io/address/0x11111112542D85B3EF69AE05771c2dCCff4fAa26

[^2_19]: https://www.scribd.com/document/920003914/1inch-Aggregation-Router-V5-Statemind

