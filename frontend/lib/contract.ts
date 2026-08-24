import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

/* =========================================================
   ORBIWORLD — CONTRACT CONFIG
   ========================================================= */

export const CONTRACT_ADDRESS =
  "0x85DBcA033F79018602f752Cf36a9b3683657f631";

export const USDT_ADDRESS =
  "0x855c91cF87745e01e370B671f0Da25dcC7685394";

export const BSC_TESTNET = {
  chainId: 97,
  chainHex: "0x61",
  name: "BSC Testnet",
  rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  explorer: "https://testnet.bscscan.com",
};

/* =========================================================
   CONTRACT CONSTANTS
   ========================================================= */

export const USDT_DECIMALS = 18;

export const MAX_PACKAGE_MULTIPLIER = 2;

export const DEFAULT_DAILY_ROI_BPS = 50;

export const DEFAULT_MIN_STAKE = 50;

export const DEFAULT_MIN_TOPUP = 50;

export const DEFAULT_MIN_WITHDRAWAL = 20;

export const DEFAULT_WITHDRAWAL_FEE_BPS = 1000;

/* =========================================================
   ORBI CONTRACT ABI
   ========================================================= */

export const ORBI_ABI = [
  /* ---------------- USER / STAKING ---------------- */

  "function activateAccount(uint256 amount)",

  "function topUp(uint256 amount)",

  "function registerOnly(address sponsorWallet)",

  /* ---------------- WITHDRAWAL ---------------- */

  "function requestWithdraw(uint8 walletType,uint256 amount)",

  /* ---------------- EMERGENCY CAPITAL ---------------- */

  "function emergencyCapitalWithdraw()",

  /* ---------------- USER DATA ---------------- */

  "function myProfile() view returns (tuple(uint256 id,address wallet,uint256 sponsorId,uint8 status,uint32 directCount,uint32 activeDirectCount,uint256 lifetimeBusiness,uint256 monthlyBusiness,uint256 todayBusiness,uint256 powerLegBusiness,uint256 otherLegBusiness,uint256 earningWallet,uint256 rankWallet,uint256 royaltyWallet,uint256 totalROIIncome,uint256 totalLevelIncome,uint256 totalRankIncome,uint256 totalRoyaltyIncome,uint256 totalWithdrawn,uint8 rank,uint8 royalty))",

  "function getUser(uint256 userId) view returns (tuple(uint256 id,address wallet,uint256 sponsorId,uint8 status,uint32 directCount,uint32 activeDirectCount,uint256 lifetimeBusiness,uint256 monthlyBusiness,uint256 todayBusiness,uint256 powerLegBusiness,uint256 otherLegBusiness,uint256 earningWallet,uint256 rankWallet,uint256 royaltyWallet,uint256 totalROIIncome,uint256 totalLevelIncome,uint256 totalRankIncome,uint256 totalRoyaltyIncome,uint256 totalWithdrawn,uint8 rank,uint8 royalty))",

  "function getUserId(address wallet) view returns (uint256)",

  "function getSponsor(uint256 userId) view returns (uint256)",

  "function getWallet(uint256 userId) view returns (address)",

  "function isRegistered(address wallet) view returns (bool)",

  /* ---------------- CONTRACT STATE ---------------- */

  "function paused() view returns (bool)",

  /* ---------------- SYSTEM CONFIG ---------------- */

  "function s_systemStats() view returns (uint256 totalUsers,uint256 totalPackages,uint256 totalWithdrawRequests)",

  "function s_businessStats() view returns (uint256 lifetimeBusiness,uint256 currentMonthBusiness,uint256 todayBusiness,uint256 lastBusinessDay,uint256 lastBusinessMonth)",

  "function s_financialStats() view returns (uint256 totalWithdrawn,uint256 totalWithdrawalFees,uint256 totalRankRewardDistributed,uint256 totalRoyaltyDistributed)",

  /* ---------------- ROI CONFIG ---------------- */

  "function s_roiConfig() view returns (uint16 dailyROIBps)",

  /* ---------------- STAKING CONFIG ---------------- */

  "function s_stakingConfig() view returns (uint256 minimumStake,uint256 minimumTopup)",

  /* ---------------- WITHDRAWAL CONFIG ---------------- */

  "function s_withdrawalConfig() view returns (uint256 minimumWithdrawal,uint16 withdrawalFeeBps)",

  /* ---------------- FEATURE CONFIG ---------------- */

  "function s_featureConfig() view returns (bool registrationEnabled,bool stakingEnabled,bool withdrawalEnabled,bool capitalWithdrawalEnabled)",

  /* ---------------- LEVEL CONFIG ---------------- */

  "function s_levelConfig() view returns (bool levelIncomeEnabled)",

  /* ---------------- RANK CONFIG ---------------- */

  "function s_rankConfig() view returns (bool rankRewardEnabled)",

  /* ---------------- ROYALTY CONFIG ---------------- */

  "function s_royaltyConfig() view returns (bool royaltyEnabled)",

  /* =====================================================
     EVENTS
     ===================================================== */

  "event UserRegistered(uint256 indexed userId,address indexed wallet,uint256 indexed sponsorId)",

  "event PackageActivated(uint256 indexed packageId,uint256 indexed userId,uint256 amount)",

  "event PackageTopup(uint256 indexed packageId,uint256 amount)",

  "event PackageClosed(uint256 indexed packageId,uint256 indexed userId,uint8 closeStatus)",

  "event DailyROIProcessed(uint256 indexed packageId,uint256 roiAmount)",

  "event LevelIncomePaid(uint256 indexed fromUserId,uint256 indexed toUserId,uint8 level,uint256 amount)",

  "event RankRewardPaid(uint256 indexed userId,uint8 rank,uint256 reward)",

  "event RoyaltyDistributed(uint256 indexed userId,uint8 royaltyLevel,uint256 amount)",

  "event RoyaltyLevelUpgraded(uint256 indexed userId,uint8 royaltyLevel)",

  "event WithdrawalRequested(uint256 indexed requestId,uint256 indexed userId,uint8 walletType,uint256 amount,uint256 fee,uint256 netAmount)",

  "event WithdrawalApproved(uint256 indexed requestId,uint256 indexed userId,uint256 amount)",

  "event WithdrawRejected(uint256 indexed requestId,uint256 indexed userId)",
] as const;

/* =========================================================
   ERC20 / USDT ABI
   ========================================================= */

export const ERC20_ABI = [
  "function decimals() view returns (uint8)",

  "function balanceOf(address account) view returns (uint256)",

  "function allowance(address owner,address spender) view returns (uint256)",

  "function approve(address spender,uint256 amount) returns (bool)",
] as const;

/* =========================================================
   CONTRACT HELPERS
   ========================================================= */

export function getContract(
  signerOrProvider:
    | ethers.Signer
    | ethers.providers.Provider
) {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    ORBI_ABI,
    signerOrProvider
  );
}

/* =========================================================
   USDT CONTRACT HELPER
   ========================================================= */

export function getUSDTContract(
  signerOrProvider:
    | ethers.Signer
    | ethers.providers.Provider
) {
  return new ethers.Contract(
    USDT_ADDRESS,
    ERC20_ABI,
    signerOrProvider
  );
}

/* =========================================================
   FORMAT HELPERS
   ========================================================= */

export function parseUSDT(amount: string) {
  return ethers.utils.parseUnits(
    amount || "0",
    USDT_DECIMALS
  );
}

export function formatUSDT(amount: ethers.BigNumber) {
  return ethers.utils.formatUnits(
    amount,
    USDT_DECIMALS
  );
}

export function shortAddress(address?: string) {
  if (!address) return "—";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* =========================================================
   EXPLORER HELPERS
   ========================================================= */

export function explorerAddress(address: string) {
  return `${BSC_TESTNET.explorer}/address/${address}`;
}

export function explorerTx(hash: string) {
  return `${BSC_TESTNET.explorer}/tx/${hash}`;
}

/* =========================================================
   WALLET TYPES
   ========================================================= */

export enum WalletType {
  EARNING = 0,
  RANK = 1,
  ROYALTY = 2,
}

/* =========================================================
   USER STATUS
   ========================================================= */

export enum UserStatus {
  NONE = 0,
  INACTIVE = 1,
  ACTIVE = 2,
  EMERGENCY_EXIT = 3,
  BLACKLISTED = 4,
}

/* =========================================================
   WITHDRAWAL STATUS
   ========================================================= */

export enum WithdrawStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

/* =========================================================
   NETWORK CHECK
   ========================================================= */

export async function ensureBscTestnet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    "any"
  );

  const network = await provider.getNetwork();

  if (network.chainId === BSC_TESTNET.chainId) {
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: BSC_TESTNET.chainHex,
        },
      ],
    });
  } catch {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BSC_TESTNET.chainHex,
          chainName: "BSC Testnet",
          nativeCurrency: {
            name: "BNB",
            symbol: "tBNB",
            decimals: 18,
          },
          rpcUrls: [BSC_TESTNET.rpcUrl],
          blockExplorerUrls: [
            BSC_TESTNET.explorer,
          ],
        },
      ],
    });
  }
}