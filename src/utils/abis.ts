/**
 * ERC20 Token ABI - Minimal interface for balance and approval
 */
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

/**
 * Uniswap V3 SwapRouter02 ABI - For executing swaps
 * https://docs.uniswap.org/contracts/v3/reference/periphery/SwapRouter02
 */
export const UNISWAP_V3_ROUTER_ABI = [
  `function exactInputSingle((
    address tokenIn,
    address tokenOut,
    uint24 fee,
    address recipient,
    uint256 amountIn,
    uint256 amountOutMinimum,
    uint160 sqrtPriceLimitX96
  )) payable returns (uint256 amountOut)`,
  'function WETH9() view returns (address)',
];
