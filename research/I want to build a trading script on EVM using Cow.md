<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I want to build a trading script on EVM using Cow Swap, between 2 tokens

Research on how to make a typescript script to:

- get the output token B quantity, given a token A quantity
- perform the trade

You can do both quoting and trading on CoW Swap from TypeScript using the CoW SDK and/or the raw Order Book API.[^1_1][^1_2]

Below is a minimal end‑to‑end outline you can adapt.

***

## Setup

- Install SDK and ethers (or viem/wagmi equivalent):

```bash
npm install @cowprotocol/cow-sdk ethers
```

- Decide chain and endpoint:
    - Supported EVM chains include Mainnet, Gnosis, Arbitrum, Base, etc.[^1_3]
    - The SDK exposes `SupportedChainId` for these networks.[^1_2][^1_4]

***

## Getting a quote (output token B for amount of A)

Using the “trading” helper from the CoW SDK is the most convenient way:

```ts
import { ethers } from "ethers";
import {
  SupportedChainId,
  TradingSdk,
  TradeParameters,
  OrderKind,
} from "@cowprotocol/cow-sdk";

async function getQuote(
  provider: ethers.providers.JsonRpcProvider,
  params: {
    chainId: SupportedChainId;
    sellToken: string;
    buyToken: string;
    amountIn: string;      // in raw units (wei)
    sellTokenDecimals: number;
    buyTokenDecimals: number;
    receiver?: string;
  }
) {
  const signer = provider.getSigner();
  const owner = await signer.getAddress();

  const sdk = new TradingSdk({
    chainId: params.chainId,
    signer,
  });

  const tradeParams: TradeParameters = {
    kind: OrderKind.SELL,                    // you fix sell amount, get quote on buy
    sellToken: params.sellToken,
    sellTokenDecimals: params.sellTokenDecimals,
    buyToken: params.buyToken,
    buyTokenDecimals: params.buyTokenDecimals,
    amount: params.amountIn,
    receiver: params.receiver ?? owner,
    from: owner,
  };

  const { quoteResults } = await sdk.getQuote(tradeParams);
  // quoteResults.buyAmount is your output token B quantity (raw units)
  return quoteResults;
}
```

`getQuote` wraps the Order Book `/quote` endpoint and returns the buy amount, fee, and other metadata so you can compute “how much token B you receive for X token A.”[^1_5][^1_4][^1_2]

If you prefer to hit the API directly, you can use `OrderBookApi.getQuote` with an `OrderQuoteRequest` specifying `sellToken`, `buyToken`, `from`, `receiver`, and `sellAmountBeforeFee` and then read `quote.buyAmount`.[^1_4][^1_1]

***

## Performing the trade

A CoW Swap “trade” is posting a signed off‑chain order to the Order Book; solvers later settle it on‑chain.[^1_6]

Using the trading SDK, you can go from quote to order in one step:

```ts
async function executeTrade(
  provider: ethers.providers.JsonRpcProvider,
  params: {
    chainId: SupportedChainId;
    sellToken: string;
    buyToken: string;
    amountIn: string;  // raw sell amount
    sellTokenDecimals: number;
    buyTokenDecimals: number;
    validTo: number;   // unix timestamp
  }
) {
  const signer = provider.getSigner();
  const owner = await signer.getAddress();

  const sdk = new TradingSdk({
    chainId: params.chainId,
    signer,
  });

  const tradeParams: TradeParameters = {
    kind: OrderKind.SELL,
    sellToken: params.sellToken,
    sellTokenDecimals: params.sellTokenDecimals,
    buyToken: params.buyToken,
    buyTokenDecimals: params.buyTokenDecimals,
    amount: params.amountIn,
    from: owner,
    receiver: owner,
    validTo: params.validTo,
  };

  // 1) Get quote and helper for posting order
  const { quoteResults, postSwapOrderFromQuote } = await sdk.getQuote(tradeParams);

  // 2) Ensure user has approved CoW Settlement contract to spend sellToken, if ERC‑20.
  //    (Do a standard ERC‑20 approve to the settlement contract address before this.)

  // 3) Sign and post the order derived from the quote
  const orderId = await postSwapOrderFromQuote(quoteResults);
  return { orderId, quoteResults };
}
```

Under the hood this will: build the EIP‑712 order, sign it with the connected signer, and POST it to the Order Book `/orders` endpoint, returning an `orderUid` you can later track.[^1_2][^1_5][^1_4][^1_3]

If you want a lower‑level flow, you can:

1. Call `OrderBookApi.getQuote` to obtain `quote`.[^1_1][^1_3]
2. Sign `quote` with `OrderSigningUtils.signOrder` (from the SDK).[^1_4]
3. POST `{ ...quote, ...orderSigningResult }` via `OrderBookApi.sendOrder`, which returns the order UID.[^1_3][^1_4]

***

## SDK features vs raw API

| Aspect | TradingSdk (high level) | OrderBookApi / raw API |
| :-- | :-- | :-- |
| Get output amount | `sdk.getQuote` → `quoteResults.buyAmount` [^1_2][^1_5] | `/quote` → `OrderQuoteResponse.buyAmount` [^1_1][^1_3] |
| Sign order | Handled inside `postSwapOrderFromQuote` [^1_5][^1_4] | `OrderSigningUtils.signOrder` manually [^1_4] |
| Submit trade | `postSwapOrderFromQuote(quoteResults)` [^1_2][^1_5] | `sendOrder` to `/orders` [^1_4][^1_3] |
| Control / flexibility | Higher level, batteries‑included | More control over payloads and appData |

If you share which chain and which two tokens you want to trade, a tailored minimal script (including approval step) can be sketched next.
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://learn.cow.fi/tutorial/quote-order

[^1_2]: https://docs.cow.fi/cow-protocol/reference/sdks/cow-sdk

[^1_3]: https://docs.cow.fi/cow-protocol/reference/apis/orderbook

[^1_4]: https://www.npmjs.com/package/@cowprotocol/cow-sdk?activeTab=readme

[^1_5]: https://github.com/cowprotocol/cow-sdk/blob/main/src/trading/README.md

[^1_6]: https://mixbytes.io/blog/modern-dex-es-how-they-re-made-cow-protocol

[^1_7]: https://github.com/gnosis/gp-swap-ui/blob/develop/README.md

[^1_8]: https://web3-ethereum-defi.readthedocs.io/api/cowswap/_autosummary_cow/eth_defi.cow.quote.html

[^1_9]: https://forum.cow.fi/t/implementing-a-solver-using-private-liquidity/974

[^1_10]: https://www.reddit.com/r/UniSwap/comments/wb18h4/uniswap_tutorial_for_developers_swap_with_v3_sdk/

[^1_11]: https://github.com/cowprotocol/cowswap

[^1_12]: https://github.com/cowdao-grants/cow-shed

[^1_13]: https://npmjs.com/package/@gnosis.pm/cow-sdk

[^1_14]: https://www.youtube.com/watch?v=1dwSEMG4YLg

[^1_15]: https://forum.cow.fi/t/use-of-cow-in-protocol-economics/3139

[^1_16]: https://www.npmjs.com/package/@cowprotocol/sdk-order-book

[^1_17]: https://coinbase-cloud.mintlify.app/api-reference/v2/rest-api/evm-swaps/evm-swaps

[^1_18]: https://github.com/Giveth/giveth-cowswap

[^1_19]: https://learn.cow.fi

[^1_20]: https://cow.fi/learn/how-to-use-cow-swap-twap-orders-via-safe-wallet

