import { ethers } from "ethers";

/* =========================================================
   GLOBAL WINDOW
========================================================= */

declare global {
  interface Window {
    ethereum?: any;
  }
}

/* =========================================================
   NETWORK
========================================================= */

export const BSC_TESTNET = {
  chainId: 97,
  chainHex: "0x61",
  name: "BSC Testnet",
  rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  explorer: "https://testnet.bscscan.com",
} as const;

/* =========================================================
   DEPLOYED CONTRACTS
========================================================= */

export const CONTRACT_ADDRESS =
  "0x8c8AbFA4d9CBBCb3420Dc870bCb3B23dbDa3fe61";

export const USDT_ADDRESS =
  "0x855c91cF87745e01e370B671f0Da25dcC7685394";

/* =========================================================
   TOKEN / PLATFORM CONSTANTS
========================================================= */

export const USDT_DECIMALS = 18;

export const MAX_PACKAGE_MULTIPLIER = 2;

export const DEFAULT_DAILY_ROI_BPS = 50;

export const DEFAULT_MIN_STAKE = 50;

export const DEFAULT_MIN_TOPUP = 50;

export const DEFAULT_MIN_WITHDRAWAL = 20;

export const DEFAULT_WITHDRAWAL_FEE_BPS = 1000;

/* =========================================================
   LEVEL INCOME
   Fresh deployed contract:
   10%, 5%, 3%, 2%, 1%, 1%, 1%, 1%, 1%, 1%
========================================================= */

export const LEVEL_INCOME_BPS = [
  1000,
  500,
  300,
  200,
  100,
  100,
  100,
  100,
  100,
  100,
] as const;

/* =========================================================
   USER TUPLE
========================================================= */

const USER_TUPLE =
  "tuple(" +
  "uint256 id," +
  "address wallet," +
  "uint256 sponsorId," +
  "uint8 status," +
  "uint32 directCount," +
  "uint32 activeDirectCount," +
  "uint256 lifetimeBusiness," +
  "uint256 monthlyBusiness," +
  "uint256 todayBusiness," +
  "uint256 powerLegBusiness," +
  "uint256 otherLegBusiness," +
  "uint256 earningWallet," +
  "uint256 rankWallet," +
  "uint256 royaltyWallet," +
  "uint256 totalROIIncome," +
  "uint256 totalLevelIncome," +
  "uint256 totalRankIncome," +
  "uint256 totalRoyaltyIncome," +
  "uint256 totalWithdrawn," +
  "uint8 rank," +
  "uint8 royalty)";

/* =========================================================
   ORBIWORLD ABI
   Only functions required by the new frontend.
========================================================= */

export const ORBI_ABI = [
  /* ---------------- REGISTRATION / STAKING ---------------- */

  "function registerOnly(address sponsorWallet)",

  "function activateAccount(uint256 amount)",

  "function topUp(uint256 amount)",

  /* ---------------- WITHDRAWAL ---------------- */

  "function requestWithdraw(uint8 walletType,uint256 amount)",

  "function emergencyCapitalWithdraw()",

  /* ---------------- USER ---------------- */

  `function myProfile() view returns (${USER_TUPLE})`,

  `function getUser(uint256 userId) view returns (${USER_TUPLE})`,

  "function getUserId(address wallet) view returns (uint256)",

  "function getSponsor(uint256 userId) view returns (uint256)",

  "function getWallet(uint256 userId) view returns (address)",

  "function getUserStatus(uint256 userId) view returns (uint8)",

  "function isRegistered(address wallet) view returns (bool)",

  /* ---------------- DASHBOARD HELPERS ---------------- */

  `function getDashboardData(uint256 userId) view returns (${USER_TUPLE} user,uint256[] packageIds,uint256[] activePackageIds,uint256[] directReferralIds)`,

  "function getBusinessStats(uint256 userId) view returns (uint256 lifetimeBusiness,uint256 monthlyBusiness,uint256 todayBusiness,uint256 powerLegBusiness,uint256 otherLegBusiness,uint256 directCount,uint256 activeDirectCount)",

  "function getDirectReferrals(uint256 userId) view returns (uint256[] memory)",

  "function getDirectLegBusiness(uint256 sponsorId,uint256 directUserId) view returns (uint256)",

  `function getDirectUsers(uint256 userId) view returns (${USER_TUPLE}[] users)`,

  /* ---------------- PACKAGE HELPERS ---------------- */

  "function getUserPackages(uint256 userId) view returns (uint256[] memory)",

  "function getActiveUserPackages(uint256 userId) view returns (uint256[] memory)",

  "function getPackages(uint256 userId) view returns (uint256[] memory)",

  "function getActivePackages(uint256 userId) view returns (uint256[] memory)",

  "function getPackageCounts(uint256 userId) view returns (uint256 totalPackages,uint256 activePackages)",

  /* ---------------- PACKAGE ---------------- */

  "function getPackage(uint256 packageId) view returns (uint256 id,uint256 userId,uint256 amount,uint256 maxPayout,uint256 roiPaid,uint256 levelPaid,uint256 totalPaid,uint256 startTime,uint256 lastProcessedDay,uint256 closedTime,bool emergencyClosed,uint8 status,uint256 queueIndex,uint256 activeUserPackageIndex,bool exists)",

  /* ---------------- SYSTEM ---------------- */

  "function paused() view returns (bool)",

  "function s_systemStats() view returns (uint256 totalUsers,uint256 totalPackages,uint256 totalWithdrawRequests)",

  "function s_businessStats() view returns (uint256 lifetimeBusiness,uint256 currentMonthBusiness,uint256 todayBusiness,uint256 lastBusinessDay,uint256 lastBusinessMonth)",

  "function s_financialStats() view returns (uint256 totalWithdrawn,uint256 totalWithdrawalFees,uint256 totalRankRewardDistributed,uint256 totalRoyaltyDistributed)",

  /* ---------------- CONFIG ---------------- */

  "function s_roiConfig() view returns (uint16 dailyROIBps)",

  "function s_stakingConfig() view returns (uint256 minimumStake,uint256 minimumTopup)",

  "function s_withdrawalConfig() view returns (uint256 minimumWithdrawal,uint16 withdrawalFeeBps)",

  "function s_featureConfig() view returns (bool registrationEnabled,bool stakingEnabled,bool withdrawalEnabled,bool capitalWithdrawalEnabled)",

  "function s_levelConfig() view returns (bool levelIncomeEnabled)",

  "function s_rankConfig() view returns (bool rankRewardEnabled)",

  "function s_royaltyConfig() view returns (bool royaltyEnabled)",

  /* ---------------- ACCESS CONTROL ---------------- */

  "function hasRole(bytes32 role,address account) view returns (bool)",
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
   CONTRACT FACTORIES
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
   PACKAGE STATUS
========================================================= */

export enum PackageStatus {
  ACTIVE = 0,
  CLOSED = 1,
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
   WALLET TYPE
========================================================= */

export enum WalletType {
  EARNING = 0,
  RANK = 1,
  ROYALTY = 2,
}

/* =========================================================
   WITHDRAW STATUS
========================================================= */

export enum WithdrawStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
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

export function formatUSDT(
  amount: ethers.BigNumber
) {
  return ethers.utils.formatUnits(
    amount,
    USDT_DECIMALS
  );
}

/* =========================================================
   NUMBER HELPERS
========================================================= */

export function toBigNumber(
  value: any
): ethers.BigNumber {
  if (ethers.BigNumber.isBigNumber(value)) {
    return value;
  }

  if (
    value === undefined ||
    value === null
  ) {
    return ethers.constants.Zero;
  }

  return ethers.BigNumber.from(value);
}

export function toNumber(
  value: any
): number {
  return toBigNumber(value).toNumber();
}

/* =========================================================
   ADDRESS HELPERS
========================================================= */

export function shortAddress(
  address?: string
) {
  if (!address) {
    return "—";
  }

  return `${address.slice(
    0,
    6
  )}...${address.slice(-4)}`;
}

export function explorerAddress(
  address: string
) {
  return `${BSC_TESTNET.explorer}/address/${address}`;
}

export function explorerTx(
  hash: string
) {
  return `${BSC_TESTNET.explorer}/tx/${hash}`;
}

/* =========================================================
   NETWORK
========================================================= */

export async function ensureBscTestnet() {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed."
    );
  }

  const provider =
    new ethers.providers.Web3Provider(
      window.ethereum,
      "any"
    );

  const network =
    await provider.getNetwork();

  if (
    network.chainId ===
    BSC_TESTNET.chainId
  ) {
    return;
  }

  try {
    await window.ethereum.request({
      method:
        "wallet_switchEthereumChain",
      params: [
        {
          chainId:
            BSC_TESTNET.chainHex,
        },
      ],
    });
  } catch {
    await window.ethereum.request({
      method:
        "wallet_addEthereumChain",
      params: [
        {
          chainId:
            BSC_TESTNET.chainHex,

          chainName:
            BSC_TESTNET.name,

          nativeCurrency: {
            name: "BNB",
            symbol: "tBNB",
            decimals: 18,
          },

          rpcUrls: [
            BSC_TESTNET.rpcUrl,
          ],

          blockExplorerUrls: [
            BSC_TESTNET.explorer,
          ],
        },
      ],
    });
  }
}