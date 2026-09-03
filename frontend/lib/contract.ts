import { ethers } from "ethers";

/* ================================================================
   ORBI WORLD — CONTRACT CONFIGURATION
   BNB SMART CHAIN TESTNET
   ================================================================ */

export const ORBI_WORLD_ADDRESS =
  "0x85cd6097462E03726A6B030d30c4396c7A234dd6";

export const MOCUSDT_ADDRESS =
  "0x9CBe843a4c02916da422aA2dD645f55AEb9d4c91";

export const BSC_TESTNET_CHAIN_ID = 97;

export const BSC_TESTNET_RPC =
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545";

export const BLOCK_EXPLORER =
  "https://testnet.bscscan.com";


/* ================================================================
   ORBI WORLD ABI
   Exact frontend-facing ABI
   ================================================================ */

export const ORBI_WORLD_ABI = [

  /* ==============================================================
     USER
     ============================================================== */

  "function getUserId(address wallet) view returns (uint256)",

  "function getWallet(uint256 userId) view returns (address)",

  "function getUser(uint256 userId) view returns (" +
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
    "uint8 royalty" +
  ")",

  "function myProfile() view returns (" +
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
    "uint8 royalty" +
  ")",

  "function getSponsor(uint256 userId) view returns (uint256)",

  "function getUserStatus(uint256 userId) view returns (uint8)",

  "function isRegistered(address wallet) view returns (bool)",


  /* ==============================================================
     DASHBOARD
     ============================================================== */

  "function getDashboardData(uint256 userId) view returns (" +
    "(" +
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
      "uint8 royalty" +
    ") user," +
    "uint256[] packageIds," +
    "uint256[] activePackageIds," +
    "uint256[] directReferralIds" +
  ")",

  "function getBusinessStats(uint256 userId) view returns (" +
    "uint256 lifetimeBusiness," +
    "uint256 monthlyBusiness," +
    "uint256 todayBusiness," +
    "uint256 powerLegBusiness," +
    "uint256 otherLegBusiness," +
    "uint256 directCount," +
    "uint256 activeDirectCount" +
  ")",


  /* ==============================================================
     REFERRAL / TEAM
     ============================================================== */

  "function getDirectReferrals(uint256 userId) view returns (uint256[])",

  "function getDirectLegBusiness(" +
    "uint256 sponsorId," +
    "uint256 directUserId" +
  ") view returns (uint256)",

  "function getDirectUsers(uint256 userId) view returns (" +
    "(" +
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
      "uint8 royalty" +
    ")[] users" +
  ")",


  /* ==============================================================
     PACKAGES
     ============================================================== */

  "function getUserPackages(uint256 userId) view returns (uint256[])",

  "function getActiveUserPackages(uint256 userId) view returns (uint256[])",

  "function getPackages(uint256 userId) view returns (uint256[])",

  "function getActivePackages(uint256 userId) view returns (uint256[])",

  "function getPackageCounts(uint256 userId) view returns (" +
    "uint256 totalPackages," +
    "uint256 activePackages" +
  ")",

  "function getPackage(uint256 packageId) view returns (" +
    "uint256 packageId," +
    "uint256 userId," +
    "uint256 amount," +
    "uint256 maxPayout," +
    "uint256 roiPaid," +
    "uint256 levelPaid," +
    "uint256 totalPaid," +
    "uint256 startTime," +
    "uint256 lastProcessedDay," +
    "uint256 closedTime," +
    "bool emergencyClosed," +
    "uint8 status," +
    "uint256 queueIndex," +
    "uint256 activeUserPackageIndex," +
    "bool exists" +
  ")",


  /* ==============================================================
     REGISTRATION
     ============================================================== */

  "function registerOnly(address sponsorWallet)",


  /* ==============================================================
     ACCOUNT ACTIVATION / STAKING
     ============================================================== */

  "function activateAccount(uint256 amount)",

  "function topUp(uint256 amount)",


  /* ==============================================================
     WITHDRAWAL
     ============================================================== */

  "function requestWithdraw(uint8 walletType,uint256 amount)",

  "function emergencyCapitalWithdraw()",


  /* ==============================================================
     ERC20 / CONTRACT CONFIG
     ============================================================== */

  "function i_usdt() view returns (address)",

  "function s_stakingConfig() view returns (" +
    "uint256 minimumStake," +
    "uint256 minimumTopup" +
  ")",

  "function s_roiConfig() view returns (" +
    "uint16 dailyROIBps" +
  ")",

  "function s_withdrawalConfig() view returns (" +
    "uint256 minimumWithdrawal," +
    "uint16 withdrawalFeeBps" +
  ")",

  "function s_automationConfig() view returns (" +
    "uint256 batchSize," +
    "bool automationEnabled" +
  ")",

  "function s_featureConfig() view returns (" +
    "bool registrationEnabled," +
    "bool stakingEnabled," +
    "bool withdrawalEnabled," +
    "bool capitalWithdrawalEnabled" +
  ")",

  // Solidity's autogenerated getter excludes the fixed array member.
  "function s_levelConfig() view returns (bool levelIncomeEnabled)",


  /* ==============================================================
     GLOBAL CONSTANTS
     ============================================================== */

  "function MAX_LEVEL() view returns (uint8)",

  "function MAX_RANK_LEVEL() view returns (uint8)",

  "function MAX_ROYALTY_LEVEL() view returns (uint8)",

  "function MAX_PACKAGE_MULTIPLIER() view returns (uint8)",

  "function BPS_DIVIDER() view returns (uint16)",

  "function PERCENT_DIVIDER() view returns (uint16)",

  "function DAY() view returns (uint256)",

  "function MONTH() view returns (uint256)",


  /* ==============================================================
     SYSTEM STATISTICS
     ============================================================== */

  "function s_systemStats() view returns (" +
    "uint256 totalUsers," +
    "uint256 totalPackages," +
    "uint256 totalWithdrawRequests" +
  ")",

  "function s_businessStats() view returns (" +
    "uint256 lifetimeBusiness," +
    "uint256 currentMonthBusiness," +
    "uint256 todayBusiness," +
    "uint256 lastBusinessDay," +
    "uint256 lastBusinessMonth" +
  ")",

  "function s_financialStats() view returns (" +
    "uint256 totalWithdrawn," +
    "uint256 totalWithdrawalFees," +
    "uint256 totalRankRewardDistributed," +
    "uint256 totalRoyaltyDistributed" +
  ")",


  /* ==============================================================
     AUTOMATION STATE
     ============================================================== */

  "function s_automationState() view returns (" +
    "uint256 processingPointer," +
    "uint256 activePackageCount," +
    "uint256 lastProcessingDay," +
    "uint16 currentMonth," +
    "uint16 currentYear" +
  ")",


  /* ==============================================================
     ADMIN / CONFIG
     ============================================================== */

  "function setStakingConfig(uint256 minimumStake,uint256 minimumTopup)",

  "function setROIConfig(uint16 dailyROIBps)",

  "function setWithdrawalConfig(" +
    "uint256 minimumWithdrawal," +
    "uint16 withdrawalFeeBps" +
  ")",

  "function setFeeWallet(address newFeeWallet)",

  "function setAutomationConfig(uint256 batchSize,bool enabled)",

  "function setFeatureConfig(" +
    "bool registrationEnabled," +
    "bool stakingEnabled," +
    "bool withdrawalEnabled," +
    "bool capitalWithdrawalEnabled" +
  ")",

  "function setLevelIncomeEnabled(bool enabled)",

  "function setLevelIncomeBps(uint8 level,uint16 incomeBps)",

  "function setRankRequirement(" +
    "uint8 rankIndex," +
    "uint256 requiredPowerLeg," +
    "uint256 requiredOtherLeg," +
    "uint256 reward" +
  ")",

  "function setRankRewardEnabled(bool enabled)",

  "function setRoyaltyRequirement(" +
    "uint8 level," +
    "uint256 requiredLifetimeBusiness," +
    "uint256 requiredMonthlyBusiness," +
    "uint8 minimumActiveDirects," +
    "uint16 royaltyBps" +
  ")",

  "function setRoyaltyEnabled(bool enabled)",

  "function pauseContract()",

  "function unpauseContract()",
] as const;


/* ================================================================
   MOCUSDT ABI
   ================================================================ */

export const MOCUSDT_ABI = [

  "function name() view returns (string)",

  "function symbol() view returns (string)",

  "function decimals() view returns (uint8)",

  "function totalSupply() view returns (uint256)",

  "function balanceOf(address account) view returns (uint256)",

  "function allowance(address owner_,address spender) view returns (uint256)",

  "function approve(address spender,uint256 amount) returns (bool)",

  "function transfer(address to,uint256 amount) returns (bool)",

  "function transferFrom(" +
    "address from," +
    "address to," +
    "uint256 amount" +
  ") returns (bool)",

] as const;


/* ================================================================
   PROVIDER HELPERS
   ================================================================ */

export function getReadProvider() {
  return new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
}


/* ================================================================
   READ CONTRACT
   ================================================================ */

export function getOrbiWorldReadContract() {
  const provider = getReadProvider();

  return new ethers.Contract(
    ORBI_WORLD_ADDRESS,
    ORBI_WORLD_ABI,
    provider
  );
}


/* ================================================================
   READ MOCUSDT CONTRACT
   ================================================================ */

export function getMocusdtReadContract() {
  const provider = getReadProvider();

  return new ethers.Contract(
    MOCUSDT_ADDRESS,
    MOCUSDT_ABI,
    provider
  );
}


/* ================================================================
   WRITE CONTRACT
   Wallet / signer required
   ================================================================ */

export function getOrbiWorldWriteContract(
  signer: ethers.Signer
) {
  return new ethers.Contract(
    ORBI_WORLD_ADDRESS,
    ORBI_WORLD_ABI,
    signer
  );
}


/* ================================================================
   WRITE MOCUSDT CONTRACT
   ================================================================ */

export function getMocusdtWriteContract(
  signer: ethers.Signer
) {
  return new ethers.Contract(
    MOCUSDT_ADDRESS,
    MOCUSDT_ABI,
    signer
  );
}


/* ================================================================
   USDT DECIMALS
   ================================================================ */

export const USDT_DECIMALS = 18;


/* ================================================================
   FORMAT USDT
   ================================================================ */

export function formatUSDT(
  value: bigint | ethers.BigNumberish
): string {
  return ethers.formatUnits(value, USDT_DECIMALS);
}


/* ================================================================
   PARSE USDT
   ================================================================ */

export function parseUSDT(
  value: string
): bigint {
  return ethers.parseUnits(value, USDT_DECIMALS);
}


/* ================================================================
   SHORT ADDRESS
   ================================================================ */

export function shortAddress(
  address: string,
  start = 6,
  end = 4
): string {
  if (!address) return "";

  return `${address.slice(0, start)}...${address.slice(-end)}`;
}


/* ================================================================
   USER STATUS
   ================================================================ */

export const USER_STATUS = {
  NONE: 0,
  INACTIVE: 1,
  ACTIVE: 2,
  EMERGENCY_EXIT: 3,
  BLACKLISTED: 4,
} as const;


/* ================================================================
   PACKAGE STATUS
   ================================================================ */

export const PACKAGE_STATUS = {
  ACTIVE: 0,
  CLOSED: 1,
} as const;


/* ================================================================
   WITHDRAW STATUS
   ============================================================== */

export const WITHDRAW_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;


/* ================================================================
   WALLET TYPE
   Contract:
   EARNING = 0
   RANK    = 1
   ROYALTY = 2
   ================================================================ */

export const WALLET_TYPE = {
  EARNING: 0,
  RANK: 1,
  ROYALTY: 2,
} as const;


/* ================================================================
   RANK LEVEL
   ================================================================ */

export const RANK_LEVEL = {
  NONE: 0,
  RANK_1: 1,
  RANK_2: 2,
  RANK_3: 3,
  RANK_4: 4,
  RANK_5: 5,
  RANK_6: 6,
} as const;


/* ================================================================
   ROYALTY LEVEL
   ================================================================ */

export const ROYALTY_LEVEL = {
  NONE: 0,
  ONE_PERCENT: 1,
  TWO_PERCENT: 2,
} as const;

/* ================================================================
   NETWORK HELPER
   ================================================================ */

export async function isCorrectNetwork(
  provider: ethers.BrowserProvider
): Promise<boolean> {

  const network = await provider.getNetwork();

  return Number(network.chainId) === BSC_TESTNET_CHAIN_ID;
}