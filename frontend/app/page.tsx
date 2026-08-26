"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

/**
 * ORBIWORLD — BSC TESTNET
 * Contract: 0x66Aad6c966C4A4E6B90E72388248A6d21c7944a6
 * USDT:     0x855c91cF87745e01e370B671f0Da25dcC7685394
 *
 * IMPORTANT:
 * 1) Install ethers v5: npm i ethers
 * 2) Put the supplied ORBI logo at: /public/orbi-logo.png
 * 3) Set DEPLOYMENT_BLOCK to the contract deployment block for faster event loading.
 *
 * This page intentionally does NOT show:
 * - public "Total Users / Total Staked / Total Business / Total Rewards Distributed"
 * - a separate income-history page for ROI/Level income.
 *
 * The current contract stores ROI + Level income in one `earningWallet`.
 * It separately stores rankWallet and royaltyWallet. Therefore the UI shows
 * "Earning Wallet (ROI + Level)" rather than inventing separate balances.
 */

const CONTRACT_ADDRESS = "0x66Aad6c966C4A4E6B90E72388248A6d21c7944a6";
const USDT_ADDRESS = "0x855c91cF87745e01e370B671f0Da25dcC7685394";

const BSC_TESTNET = {
  chainId: 97,
  chainHex: "0x61",
  name: "BSC Testnet",
  explorer: "https://testnet.bscscan.com",
};

const DEPLOYMENT_BLOCK = 0; // <-- replace with actual deployment block when known.
const USDT_DECIMALS = 18;
const MAX_PACKAGE_MULTIPLIER = 2;
const DAILY_ROI_BPS = 50; // 0.50% from current deployed source
const MIN_STAKE = 50;
const MIN_TOPUP = 50;
const MIN_WITHDRAWAL = 20;
const WITHDRAWAL_FEE_BPS = 1000; // 10%

const RANKS = [
  { name: "R1", power: 1500, other: 1500, reward: 150 },
  { name: "R2", power: 5000, other: 5000, reward: 300 },
  { name: "R3", power: 10000, other: 10000, reward: 500 },
  { name: "R4", power: 20000, other: 20000, reward: 1000 },
  { name: "R5", power: 50000, other: 50000, reward: 3000 },
  { name: "R6", power: 100000, other: 100000, reward: 5000 },
];

const ROYALTIES = [
  { name: "1%", lifetime: 25000, monthly: 5000, directs: 2, bps: 100 },
  { name: "2%", lifetime: 50000, monthly: 10000, directs: 3, bps: 200 },
];

const ORBI_ABI = [
  "function activateAccount(uint256 amount)",
  "function topUp(uint256 amount)",
  "function registerOnly(address sponsorWallet)",
  "function requestWithdraw(uint8 walletType,uint256 amount)",
  "function myProfile() view returns (tuple(uint256 id,address wallet,uint256 sponsorId,uint8 status,uint32 directCount,uint32 activeDirectCount,uint256 lifetimeBusiness,uint256 monthlyBusiness,uint256 todayBusiness,uint256 powerLegBusiness,uint256 otherLegBusiness,uint256 earningWallet,uint256 rankWallet,uint256 royaltyWallet,uint256 totalROIIncome,uint256 totalLevelIncome,uint256 totalRankIncome,uint256 totalRoyaltyIncome,uint256 totalWithdrawn,uint8 rank,uint8 royalty))",
  "function getUser(uint256 userId) view returns (tuple(uint256 id,address wallet,uint256 sponsorId,uint8 status,uint32 directCount,uint32 activeDirectCount,uint256 lifetimeBusiness,uint256 monthlyBusiness,uint256 todayBusiness,uint256 powerLegBusiness,uint256 otherLegBusiness,uint256 earningWallet,uint256 rankWallet,uint256 royaltyWallet,uint256 totalROIIncome,uint256 totalLevelIncome,uint256 totalRankIncome,uint256 totalRoyaltyIncome,uint256 totalWithdrawn,uint8 rank,uint8 royalty))",
  "function getUserId(address wallet) view returns (uint256)",
  "function getSponsor(uint256 userId) view returns (uint256)",
  "function getWallet(uint256 userId) view returns (address)",
  "function isRegistered(address wallet) view returns (bool)",
  "function paused() view returns (bool)",
  "function s_systemStats() view returns (uint256 totalUsers,uint256 totalPackages,uint256 totalWithdrawRequests)",
  "function s_businessStats() view returns (uint256 lifetimeBusiness,uint256 currentMonthBusiness,uint256 todayBusiness,uint256 lastBusinessDay,uint256 lastBusinessMonth)",
  "function s_financialStats() view returns (uint256 totalWithdrawn,uint256 totalWithdrawalFees,uint256 totalRankRewardDistributed,uint256 totalRoyaltyDistributed)",
  "function s_roiConfig() view returns (uint16 dailyROIBps)",
  "function s_stakingConfig() view returns (uint256 minimumStake,uint256 minimumTopup)",
  "function s_withdrawalConfig() view returns (uint256 minimumWithdrawal,uint16 withdrawalFeeBps)",
  "function s_featureConfig() view returns (bool registrationEnabled,bool stakingEnabled,bool withdrawalEnabled,bool capitalWithdrawalEnabled)",
  "function s_levelConfig() view returns (bool levelIncomeEnabled)",
  "function s_rankConfig() view returns (bool rankRewardEnabled)",
  "function s_royaltyConfig() view returns (bool royaltyEnabled)",

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
];

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];

type User = {
  id: bigint;
  wallet: string;
  sponsorId: bigint;
  status: number;
  directCount: number;
  activeDirectCount: number;
  lifetimeBusiness: bigint;
  monthlyBusiness: bigint;
  todayBusiness: bigint;
  powerLegBusiness: bigint;
  otherLegBusiness: bigint;
  earningWallet: bigint;
  rankWallet: bigint;
  royaltyWallet: bigint;
  totalROIIncome: bigint;
  totalLevelIncome: bigint;
  totalRankIncome: bigint;
  totalRoyaltyIncome: bigint;
  totalWithdrawn: bigint;
  rank: number;
  royalty: number;
};

type PackageRow = {
  packageId: string;
  amount: bigint;
  startTime?: number;
  closed: boolean;
  closeStatus?: number;
};

type WithdrawalRow = {
  requestId: string;
  walletType: number;
  amount: bigint;
  fee: bigint;
  netAmount: bigint;
  time: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

type RankHistory = {
  rank: number;
  reward: bigint;
  blockNumber: number;
};

type RoyaltyHistory = {
  level: number;
  amount: bigint;
  blockNumber: number;
};

type TeamNode = {
  id: string;
  wallet: string;
  sponsorId: string;
  directCount: number;
  activeDirectCount: number;
  status: number;
};

function asBigInt(value: any): bigint {
  try {
    return BigInt(value?.toString?.() ?? value ?? 0);
  } catch {
    return 0n;
  }
}

function parseUser(raw: any): User {
  return {
    id: asBigInt(raw.id ?? raw[0]),
    wallet: raw.wallet ?? raw[1],
    sponsorId: asBigInt(raw.sponsorId ?? raw[2]),
    status: Number(raw.status ?? raw[3] ?? 0),
    directCount: Number(raw.directCount ?? raw[4] ?? 0),
    activeDirectCount: Number(raw.activeDirectCount ?? raw[5] ?? 0),
    lifetimeBusiness: asBigInt(raw.lifetimeBusiness ?? raw[6]),
    monthlyBusiness: asBigInt(raw.monthlyBusiness ?? raw[7]),
    todayBusiness: asBigInt(raw.todayBusiness ?? raw[8]),
    powerLegBusiness: asBigInt(raw.powerLegBusiness ?? raw[9]),
    otherLegBusiness: asBigInt(raw.otherLegBusiness ?? raw[10]),
    earningWallet: asBigInt(raw.earningWallet ?? raw[11]),
    rankWallet: asBigInt(raw.rankWallet ?? raw[12]),
    royaltyWallet: asBigInt(raw.royaltyWallet ?? raw[13]),
    totalROIIncome: asBigInt(raw.totalROIIncome ?? raw[14]),
    totalLevelIncome: asBigInt(raw.totalLevelIncome ?? raw[15]),
    totalRankIncome: asBigInt(raw.totalRankIncome ?? raw[16]),
    totalRoyaltyIncome: asBigInt(raw.totalRoyaltyIncome ?? raw[17]),
    totalWithdrawn: asBigInt(raw.totalWithdrawn ?? raw[18]),
    rank: Number(raw.rank ?? raw[19] ?? 0),
    royalty: Number(raw.royalty ?? raw[20] ?? 0),
  };
}

function fmt(value: bigint | number, digits = 2) {
  const n = typeof value === "bigint" ? Number(ethers.utils.formatUnits(value, USDT_DECIMALS)) : value;
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function units(value: string) {
  return ethers.utils.parseUnits(value || "0", USDT_DECIMALS);
}

function shortAddress(address?: string) {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function statusLabel(status: number) {
  return ["NONE", "INACTIVE", "ACTIVE", "EMERGENCY EXIT", "BLACKLISTED"][status] ?? "UNKNOWN";
}

function rankLabel(rank: number) {
  return rank === 0 ? "NONE" : `R${rank}`;
}

function royaltyLabel(level: number) {
  return level === 0 ? "NONE" : level === 1 ? "1%" : "2%";
}

function walletTypeLabel(type: number) {
  return type === 0 ? "Earning" : type === 1 ? "Rank" : "Royalty";
}

function explorerTx(hash: string) {
  return `${BSC_TESTNET.explorer}/tx/${hash}`;
}

function explorerAddress(address: string) {
  return `${BSC_TESTNET.explorer}/address/${address}`;
}

export default function Page() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [token, setToken] = useState<ethers.Contract | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [registered, setRegistered] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [rankHistory, setRankHistory] = useState<RankHistory[]>([]);
  const [royaltyHistory, setRoyaltyHistory] = useState<RoyaltyHistory[]>([]);
  const [team, setTeam] = useState<TeamNode[]>([]);

  const [section, setSection] = useState("dashboard");
  const [historyMenu, setHistoryMenu] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);

  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawWallet, setWithdrawWallet] = useState(0);
  const [sponsor, setSponsor] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [config, setConfig] = useState({
    minStake: MIN_STAKE,
    minTopup: MIN_TOPUP,
    minWithdrawal: MIN_WITHDRAWAL,
    feeBps: WITHDRAWAL_FEE_BPS,
    roiBps: DAILY_ROI_BPS,
    registrationEnabled: true,
    stakingEnabled: true,
    withdrawalEnabled: true,
    levelEnabled: true,
    rankEnabled: true,
    royaltyEnabled: true,
  });

  const totalAvailable = useMemo(() => {
    if (!user) return 0n;
    return user.earningWallet + user.rankWallet + user.royaltyWallet;
  }, [user]);

  const setNotice = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4500);
  };

  const ensureNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    const network = await new ethers.providers.Web3Provider(window.ethereum, "any").getNetwork();
    if (network.chainId === BSC_TESTNET.chainId) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_TESTNET.chainHex }],
      });
    } catch {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BSC_TESTNET.chainHex,
          chainName: "BSC Testnet",
          nativeCurrency: { name: "BNB", symbol: "tBNB", decimals: 18 },
          rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
          blockExplorerUrls: [BSC_TESTNET.explorer],
        }],
      });
    }
  }, []);

  const loadConfig = useCallback(async (c: ethers.Contract) => {
    try {
      const [staking, withdrawal, roi, features, level, rank, royalty] = await Promise.all([
        c.s_stakingConfig(),
        c.s_withdrawalConfig(),
        c.s_roiConfig(),
        c.s_featureConfig(),
        c.s_levelConfig(),
        c.s_rankConfig(),
        c.s_royaltyConfig(),
      ]);
      setConfig({
        minStake: Number(ethers.utils.formatUnits(staking.minimumStake ?? staking[0], 18)),
        minTopup: Number(ethers.utils.formatUnits(staking.minimumTopup ?? staking[1], 18)),
        minWithdrawal: Number(ethers.utils.formatUnits(withdrawal.minimumWithdrawal ?? withdrawal[0], 18)),
        feeBps: Number(withdrawal.withdrawalFeeBps ?? withdrawal[1]),
        roiBps: Number(roi.dailyROIBps ?? roi[0]),
        registrationEnabled: Boolean(features.registrationEnabled ?? features[0]),
        stakingEnabled: Boolean(features.stakingEnabled ?? features[1]),
        withdrawalEnabled: Boolean(features.withdrawalEnabled ?? features[2]),
        levelEnabled: Boolean(level.levelIncomeEnabled ?? level[0]),
        rankEnabled: Boolean(rank.rankRewardEnabled ?? rank[0]),
        royaltyEnabled: Boolean(royalty.royaltyEnabled ?? royalty[0]),
      });
    } catch (e) {
      console.warn("config load", e);
    }
  }, []);

  const loadUser = useCallback(async (c: ethers.Contract, address: string) => {
    const isReg = await c.isRegistered(address);
    setRegistered(isReg);
    if (!isReg) {
      setUser(null);
      return null;
    }
    const raw = await c.myProfile();
    const parsed = parseUser(raw);
    setUser(parsed);
    return parsed;
  }, []);

  const loadPackages = useCallback(async (c: ethers.Contract, userId: bigint) => {
    try {
      const activated = await c.queryFilter(c.filters.PackageActivated(null, userId, null), DEPLOYMENT_BLOCK, "latest");
      const topped = await c.queryFilter(c.filters.PackageTopup(null), DEPLOYMENT_BLOCK, "latest");
      const closed = await c.queryFilter(c.filters.PackageClosed(null, userId, null), DEPLOYMENT_BLOCK, "latest");

      const map = new Map<string, PackageRow>();
      for (const ev of [...activated, ...topped]) {
        const args: any = ev.args;
        const id = asBigInt(args.packageId ?? args[0]).toString();
        const amount = asBigInt(args.amount ?? args[2] ?? args[1]);
        if (!map.has(id)) {
          map.set(id, {
            packageId: id,
            amount,
            closed: false,
          });
        }
      }
      for (const ev of closed) {
        const args: any = ev.args;
        const id = asBigInt(args.packageId ?? args[0]).toString();
        const row = map.get(id);
        if (row) {
          row.closed = true;
          row.closeStatus = Number(args.closeStatus ?? args[2] ?? 0);
        }
      }

      const rows = Array.from(map.values()).sort((a, b) => Number(BigInt(b.packageId) - BigInt(a.packageId)));
      setPackages(rows);
    } catch (e) {
      console.warn("package events", e);
      setPackages([]);
    }
  }, []);

  const loadWithdrawals = useCallback(async (c: ethers.Contract, userId: bigint) => {
    try {
      const req = await c.queryFilter(c.filters.WithdrawalRequested(null, userId, null), DEPLOYMENT_BLOCK, "latest");
      const approved = await c.queryFilter(c.filters.WithdrawalApproved(null, userId, null), DEPLOYMENT_BLOCK, "latest");
      const rejected = await c.queryFilter(c.filters.WithdrawRejected(null, userId), DEPLOYMENT_BLOCK, "latest");

      const map = new Map<string, WithdrawalRow>();
      for (const ev of req) {
        const a: any = ev.args;
        const id = asBigInt(a.requestId ?? a[0]).toString();
        map.set(id, {
          requestId: id,
          walletType: Number(a.walletType ?? a[2]),
          amount: asBigInt(a.amount ?? a[3]),
          fee: asBigInt(a.fee ?? a[4]),
          netAmount: asBigInt(a.netAmount ?? a[5]),
          time: Math.floor(Date.now() / 1000),
          status: "PENDING",
        });
      }
      for (const ev of approved) {
        const a: any = ev.args;
        const id = asBigInt(a.requestId ?? a[0]).toString();
        const row = map.get(id);
        if (row) row.status = "APPROVED";
      }
      for (const ev of rejected) {
        const a: any = ev.args;
        const id = asBigInt(a.requestId ?? a[0]).toString();
        const row = map.get(id);
        if (row) row.status = "REJECTED";
      }

      // Event args do not contain requestTime. Read block timestamps.
      for (const ev of req) {
        const a: any = ev.args;
        const id = asBigInt(a.requestId ?? a[0]).toString();
        const row = map.get(id);
        if (row) {
          try {
            const block = await c.provider.getBlock(ev.blockNumber);
            row.time = block.timestamp;
          } catch {}
        }
      }

      setWithdrawals(
        Array.from(map.values()).sort((a, b) => b.time - a.time)
      );
    } catch (e) {
      console.warn("withdrawal events", e);
      setWithdrawals([]);
    }
  }, []);

  const loadRankRoyaltyHistory = useCallback(async (c: ethers.Contract, userId: bigint) => {
    try {
      const [r, ro] = await Promise.all([
        c.queryFilter(c.filters.RankRewardPaid(userId), DEPLOYMENT_BLOCK, "latest"),
        c.queryFilter(c.filters.RoyaltyDistributed(userId), DEPLOYMENT_BLOCK, "latest"),
      ]);
      setRankHistory(r.map((ev: any) => ({
        rank: Number(ev.args.rank ?? ev.args[1]),
        reward: asBigInt(ev.args.reward ?? ev.args[2]),
        blockNumber: ev.blockNumber,
      })).reverse());
      setRoyaltyHistory(ro.map((ev: any) => ({
        level: Number(ev.args.royaltyLevel ?? ev.args[1]),
        amount: asBigInt(ev.args.amount ?? ev.args[2]),
        blockNumber: ev.blockNumber,
      })).reverse());
    } catch (e) {
      console.warn("rank/royalty history", e);
      setRankHistory([]);
      setRoyaltyHistory([]);
    }
  }, []);

  const loadTeam = useCallback(async (c: ethers.Contract, userId: bigint) => {
    try {
      const logs = await c.queryFilter(c.filters.UserRegistered(null, null, userId), DEPLOYMENT_BLOCK, "latest");
      const nodes: TeamNode[] = [];
      for (const ev of logs) {
        const a: any = ev.args;
        const id = asBigInt(a.userId ?? a[0]);
        const wallet = String(a.wallet ?? a[1]);
        try {
          const u = parseUser(await c.getUser(id));
          nodes.push({
            id: id.toString(),
            wallet,
            sponsorId: asBigInt(a.sponsorId ?? a[2]).toString(),
            directCount: u.directCount,
            activeDirectCount: u.activeDirectCount,
            status: u.status,
          });
        } catch {
          nodes.push({
            id: id.toString(),
            wallet,
            sponsorId: asBigInt(a.sponsorId ?? a[2]).toString(),
            directCount: 0,
            activeDirectCount: 0,
            status: 1,
          });
        }
      }
      setTeam(nodes.reverse());
    } catch (e) {
      console.warn("team events", e);
      setTeam([]);
    }
  }, []);

  const refresh = useCallback(async (c = contract, address = account) => {
    if (!c || !address) return;
    try {
      const [rawBalance, currentUser] = await Promise.all([
        token?.balanceOf(address).catch(() => ethers.constants.Zero),
        loadUser(c, address),
      ]);
      setTokenBalance(asBigInt(rawBalance));
      await loadConfig(c);
      if (!currentUser) {
        setPackages([]);
        setWithdrawals([]);
        setRankHistory([]);
        setRoyaltyHistory([]);
        setTeam([]);
        return;
      }
      await Promise.all([
        loadPackages(c, currentUser.id),
        loadWithdrawals(c, currentUser.id),
        loadRankRoyaltyHistory(c, currentUser.id),
        loadTeam(c, currentUser.id),
      ]);
    } catch (e: any) {
      console.error(e);
      setNotice(e?.message || "Unable to refresh data.");
    }
  }, [account, contract, token, loadConfig, loadUser, loadPackages, loadWithdrawals, loadRankRoyaltyHistory, loadTeam]);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask.");
      await ensureNetwork();
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const p = new ethers.providers.Web3Provider(window.ethereum, "any");
      const s = p.getSigner();
      const address = await s.getAddress();

      setProvider(p);
      setSigner(s);
      setAccount(address);

      const c = new ethers.Contract(CONTRACT_ADDRESS, ORBI_ABI, s);
      const t = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, s);
      setContract(c);
      setToken(t);

      await loadConfig(c);
      await loadUser(c, address);
      setNotice("Wallet connected.");
    } catch (e: any) {
      console.error(e);
      setNotice(e?.message || "Wallet connection failed.");
    }
  }, [ensureNetwork, loadConfig, loadUser]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handler = () => connectWallet().catch(() => {});
    window.ethereum.on?.("accountsChanged", handler);
    window.ethereum.on?.("chainChanged", () => window.location.reload());
    return () => {
      window.ethereum.removeListener?.("accountsChanged", handler);
    };
  }, [connectWallet]);

  useEffect(() => {
    if (contract && account) refresh(contract, account);
  }, [contract, account, refresh]);

  async function approveIfNeeded(amount: ethers.BigNumber) {
  if (!token || !signer) {
    throw new Error("Wallet not connected.");
  }

  const allowance = await token.allowance(account, CONTRACT_ADDRESS);

  if (allowance.gte(amount)) return;

  const tx = await token.approve(CONTRACT_ADDRESS, amount);

  setNotice("Approve transaction submitted...");

  await tx.wait();
}

  async function registerUser() {
    if (!contract || !signer) return;
    try {
      setBusy(true);
      const ref = sponsor.trim() || ethers.constants.AddressZero;
      if (ref !== ethers.constants.AddressZero && !ethers.utils.isAddress(ref)) {
        throw new Error("Enter a valid sponsor wallet address.");
      }
      const tx = await contract.registerOnly(ref);
      setNotice("Registration submitted...");
      await tx.wait();
      setNotice("Registration successful.");
      await refresh(contract, account);
    } catch (e: any) {
      setNotice(e?.error?.message || e?.data?.message || e?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function activate() {
    if (!contract || !token) return;
    try {
      const amount = units(stakeAmount);
      if (amount.lt(units(String(config.minStake)))) throw new Error(`Minimum stake is ${config.minStake} USDT.`);
      setBusy(true);
      await approveIfNeeded(amount);
      const tx = await contract.activateAccount(amount);
      setNotice("Activation transaction submitted...");
      await tx.wait();
      setStakeAmount("");
      setNotice("Package activated successfully.");
      await refresh(contract, account);
    } catch (e: any) {
      setNotice(e?.error?.message || e?.data?.message || e?.message || "Activation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function topUp() {
    if (!contract || !token) return;
    try {
      const amount = units(stakeAmount);
      if (amount.lt(units(String(config.minTopup)))) throw new Error(`Minimum top-up is ${config.minTopup} USDT.`);
      setBusy(true);
      await approveIfNeeded(amount);
      const tx = await contract.topUp(amount);
      setNotice("Top-up transaction submitted...");
      await tx.wait();
      setStakeAmount("");
      setNotice("Top-up successful.");
      await refresh(contract, account);
    } catch (e: any) {
      setNotice(e?.error?.message || e?.data?.message || e?.message || "Top-up failed.");
    } finally {
      setBusy(false);
    }
  }

  async function requestWithdrawal() {
    if (!contract) return;
    try {
      const amount = units(withdrawAmount);
      if (amount.lt(units(String(config.minWithdrawal)))) {
        throw new Error(`Minimum withdrawal is ${config.minWithdrawal} USDT.`);
      }
      const available = withdrawWallet === 0
        ? user?.earningWallet ?? 0n
        : withdrawWallet === 1
          ? user?.rankWallet ?? 0n
          : user?.royaltyWallet ?? 0n;
      if (amount.gt(available)) throw new Error("Insufficient selected wallet balance.");
      setBusy(true);
      const tx = await contract.requestWithdraw(withdrawWallet, amount);
      setNotice("Withdrawal request submitted...");
      await tx.wait();
      setWithdrawAmount("");
      setNotice("Withdrawal request created. Admin will review and release it manually.");
      await refresh(contract, account);
    } catch (e: any) {
      setNotice(e?.error?.message || e?.data?.message || e?.message || "Withdrawal request failed.");
    } finally {
      setBusy(false);
    }
  }

  const nextRank = user ? RANKS[Math.min(Math.max(user.rank, 0), RANKS.length - 1)] : RANKS[0];
  const currentRank = user?.rank ?? 0;
  const targetRankIndex = Math.min(currentRank, RANKS.length - 1);
  const rankTarget = RANKS[targetRankIndex] ?? RANKS[0];
  const royaltyLevel = user?.royalty ?? 0;
  const nextRoyalty = ROYALTIES[Math.min(royaltyLevel, ROYALTIES.length - 1)];

  const publicHero = (
    <section className="hero">
      <div className="heroGlow" />
      <img src="/orbi-logo.png" className="heroLogo" alt="ORBI" />
      <div className="eyebrow">BSC TESTNET • SMART CONTRACT POWERED</div>
      <h1>Build Your Network.<br /><span>Grow Your Business.</span></h1>
      <p>Decentralized staking and community rewards powered by smart contracts.</p>
      <div className="heroActions">
        <button className="primary" onClick={connectWallet}>Connect Wallet</button>
        <button className="secondary" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>Explore Platform</button>
      </div>
      <div className="heroNote">ORBIWORLD • BSC Testnet</div>
    </section>
  );

  if (!account || !user) {
    return (
      <main className="site">
        <nav className="publicNav">
          <div className="brand"><img src="/orbi-logo.png" alt="ORBI" /><span>ORBIWORLD</span></div>
          <button className="navConnect" onClick={connectWallet}>Connect Wallet</button>
        </nav>
        {publicHero}

        <section id="how" className="section">
          <SectionTitle eyebrow="HOW IT WORKS" title="Simple. Transparent. On-chain." text="Connect your wallet, register with a sponsor, activate your package and access eligible rewards." />
          <div className="steps">
            {[
              ["01", "Connect Wallet", "Connect MetaMask on BSC Testnet."],
              ["02", "Register", "Register with a sponsor wallet or continue without one."],
              ["03", "Activate Package", "Approve USDT and activate your first package."],
              ["04", "Earn Eligible Rewards", "ROI is processed by the contract automation flow; withdrawals are requested by users and released manually by the admin."],
            ].map(([n, t, d]) => <div className="step" key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </section>

        <section className="section dark">
          <SectionTitle eyebrow="PACKAGES" title="Flexible package activation" text="ORBIWORLD creates an on-chain package for the amount you activate." />
          <div className="packageGrid">
            <div className="glassCard"><span>Minimum Stake</span><strong>{config.minStake} USDT</strong><small>First package</small></div>
            <div className="glassCard"><span>Daily ROI</span><strong>{(config.roiBps / 100).toFixed(2)}%</strong><small>Configured in contract</small></div>
            <div className="glassCard"><span>Maximum Payout</span><strong>{MAX_PACKAGE_MULTIPLIER}×</strong><small>Per package</small></div>
            <div className="glassCard"><span>Minimum Top-up</span><strong>{config.minTopup} USDT</strong><small>Additional package</small></div>
          </div>
        </section>

        <section className="section">
          <SectionTitle eyebrow="BUSINESS MODEL" title="One package. Multiple reward engines." text="Your on-chain business activity can qualify you for different reward systems." />
          <div className="flow">
            {["Your Package", "Daily ROI", "Level Income", "Rank Rewards", "Royalty"].map((x, i) => <div key={x} className="flowItem"><span>{i + 1}</span>{x}</div>)}
          </div>
        </section>

        <section className="section dark">
          <SectionTitle eyebrow="RANK SYSTEM" title="Six rank levels" text="Rank qualification uses Power Leg and Other Leg business volume." />
          <div className="rankGrid">{RANKS.map((r, i) => <div className="rankCard" key={r.name}><div className="rankBadge">{r.name}</div><h3>{r.reward.toLocaleString()} USDT</h3><p>Power {r.power.toLocaleString()} • Other {r.other.toLocaleString()}</p><span>Reward</span></div>)}</div>
        </section>

        <section className="section">
          <SectionTitle eyebrow="ROYALTY" title="Business-based royalty" text="Royalty qualification is based on lifetime business, rolling monthly business and active directs." />
          <div className="royaltyGrid">{ROYALTIES.map(r => <div className="royaltyCard" key={r.name}><strong>{r.name}</strong><span>Lifetime {r.lifetime.toLocaleString()} USDT</span><span>Monthly {r.monthly.toLocaleString()} USDT</span><span>Active Directs {r.directs}</span></div>)}</div>
        </section>

        <section className="section dark">
          <SectionTitle eyebrow="TRANSPARENCY" title="Smart contract information" text="Use the explorer to verify the deployed testnet contract." />
          <div className="contractBox">
            <div><span>Network</span><b>{BSC_TESTNET.name}</b></div>
            <div><span>Contract</span><code>{shortAddress(CONTRACT_ADDRESS)}</code></div>
            <div><span>USDT</span><code>{shortAddress(USDT_ADDRESS)}</code></div>
            <a href={explorerAddress(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">Open contract on BscScan ↗</a>
          </div>
        </section>

        <section className="section">
          <SectionTitle eyebrow="FAQ" title="Frequently asked questions" />
          <div className="faq">{[
            ["How does staking work?", "Connect, register, approve USDT and activate a package."],
            ["What is the maximum payout?", "The current contract sets MAX_PACKAGE_MULTIPLIER to 2×."],
            ["How does referral work?", "Registration stores a sponsor wallet and builds the business tree."],
            ["How is royalty calculated?", "The contract uses the configured lifetime business, monthly business and active-direct requirements."],
            ["How do withdrawals work?", "Users create an on-chain withdrawal request. Admin approval/release happens separately."],
            ["What happens at package cap?", "The package closes when total credited package income reaches its maximum payout."],
            ["Is withdrawal automatic?", "No. The website only creates the request; release is manual by the authorized withdrawal/admin role."],
          ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </section>

        <footer>© {new Date().getFullYear()} ORBIWORLD • Connecting Worlds</footer>

        {message && <Toast text={message} />}
        <Styles />
      </main>
    );
  }

  return (
    <main className="dashboardShell">
      <aside className="sidebar">
        <div className="sideBrand"><img src="/orbi-logo.png" alt="ORBI" /><div><b>ORBIWORLD</b><small>CONNECTING WORLDS</small></div></div>
        <nav>
          {[
            ["dashboard", "Dashboard"],
            ["packages", "My Packages"],
            ["business", "Business Center"],
            ["referral", "Referral Center"],
            ["rank", "Rank Center"],
            ["royalty", "Royalty Center"],
            ["withdraw", "Withdrawal"],
          ].map(([id, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>{label}</button>)}
          <div className="sideDivider" />
          <button onClick={() => setHistoryMenu(v => !v)}>History <span>⌄</span></button>
          {historyMenu && <div className="subnav">
            <button onClick={() => setSection("stakingHistory")}>Staking History</button>
            <button onClick={() => setSection("withdrawHistory")}>Withdrawal History</button>
            <button onClick={() => setSection("rankHistory")}>Rank Reward History</button>
            <button onClick={() => setSection("royaltyHistory")}>Royalty History</button>
          </div>}
          <button onClick={() => setProfileMenu(v => !v)}>Profile <span>⌄</span></button>
          {profileMenu && <div className="subnav"><button onClick={() => setSection("profile")}>My Profile</button></div>}
        </nav>
        <a className="explorerSide" href={explorerAddress(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">View Contract ↗</a>
      </aside>

      <section className="dashMain">
        <header className="dashTop">
          <div><span className="eyebrow">ORBIWORLD DASHBOARD</span><h1>{sectionTitle(section)}</h1></div>
          <div className="walletChip">
            <span className="networkDot" />
            <div><b>{shortAddress(account)}</b><small>BSC Testnet</small></div>
            <button onClick={() => navigator.clipboard.writeText(account)}>Copy</button>
          </div>
        </header>

        {message && <Toast text={message} />}

        {section === "dashboard" && (
          <>
            <div className="welcome"><div><span className="eyebrow">WELCOME BACK</span><h2>Grow your business, one block at a time.</h2><p>{statusLabel(user.status)} • User #{user.id.toString()}</p></div><div className="walletBalance"><span>Wallet USDT</span><strong>{fmt(tokenBalance)}</strong></div></div>
            <div className="cards four">
              <Metric title="Earning Wallet" value={fmt(user.earningWallet)} sub="ROI + Level Income" />
              <Metric title="Rank Wallet" value={fmt(user.rankWallet)} sub="Available rank rewards" />
              <Metric title="Royalty Wallet" value={fmt(user.royaltyWallet)} sub="Available royalty" />
              <Metric title="Total Available" value={fmt(totalAvailable)} sub="All withdrawable wallets" />
            </div>
            <div className="cards four compact">
              <Metric title="Lifetime ROI" value={fmt(user.totalROIIncome)} sub="Cumulative" />
              <Metric title="Lifetime Level" value={fmt(user.totalLevelIncome)} sub="Cumulative" />
              <Metric title="Rank Rewards" value={fmt(user.totalRankIncome)} sub="Cumulative" />
              <Metric title="Royalty" value={fmt(user.totalRoyaltyIncome)} sub="Cumulative" />
            </div>
            <div className="twoCol">
              <Card title="Business Snapshot">
                <div className="statsList">
                  <Row label="Today Business" value={`${fmt(user.todayBusiness)} USDT`} />
                  <Row label="Rolling 30-Day Business" value={`${fmt(user.monthlyBusiness)} USDT`} />
                  <Row label="Lifetime Business" value={`${fmt(user.lifetimeBusiness)} USDT`} />
                  <Row label="Power Leg" value={`${fmt(user.powerLegBusiness)} USDT`} />
                  <Row label="Other Leg" value={`${fmt(user.otherLegBusiness)} USDT`} />
                </div>
              </Card>
              <Card title="Current Qualification">
                <div className="qualify">
                  <div><span>Rank</span><strong>{rankLabel(user.rank)}</strong></div>
                  <div><span>Royalty</span><strong>{royaltyLabel(user.royalty)}</strong></div>
                  <div><span>Active Directs</span><strong>{user.activeDirectCount}</strong></div>
                  <div><span>Directs</span><strong>{user.directCount}</strong></div>
                </div>
                <button className="primary full" onClick={() => setSection("rank")}>View Rank Progress</button>
              </Card>
            </div>
          </>
        )}

        {section === "packages" && (
          <PageSection title="My Packages" subtitle="Your on-chain package activity.">
            <StakePanel user={user} config={config} amount={stakeAmount} setAmount={setStakeAmount} activate={activate} topUp={topUp} busy={busy} />
            <div className="tableCard">
              <div className="tableHead"><span>Package</span><span>Stake</span><span>Max Payout</span><span>Status</span></div>
              {packages.length === 0 ? <Empty text="No package events found for this wallet." /> : packages.map(p => <div className="tableRow" key={p.packageId}><span>#{p.packageId}</span><span>{fmt(p.amount)} USDT</span><span>{fmt(p.amount * 2n)} USDT</span><span className={p.closed ? "pill red" : "pill green"}>{p.closed ? "CLOSED" : "ACTIVE"}</span></div>)}
            </div>
            <div className="infoBanner">Package ROI is processed by the contract's daily automation flow. Withdrawal is separate and remains manual-admin release.</div>
          </PageSection>
        )}

        {section === "business" && (
          <PageSection title="Business Center" subtitle="Live business values from your on-chain User struct.">
            <div className="cards three">
              <Metric title="Today Business" value={`${fmt(user.todayBusiness)} USDT`} sub="Current business day" />
              <Metric title="Rolling 30-Day Business" value={`${fmt(user.monthlyBusiness)} USDT`} sub="Live monthly window" />
              <Metric title="Lifetime Business" value={`${fmt(user.lifetimeBusiness)} USDT`} sub="Total business" />
            </div>
            <div className="twoCol">
              <Card title="Leg Business"><div className="legBars"><Bar label="Power Leg" value={user.powerLegBusiness} total={user.powerLegBusiness + user.otherLegBusiness} /><Bar label="Other Leg" value={user.otherLegBusiness} total={user.powerLegBusiness + user.otherLegBusiness} /></div></Card>
              <Card title="Team Overview"><div className="statsList"><Row label="Direct Referrals" value={user.directCount.toString()} /><Row label="Active Directs" value={user.activeDirectCount.toString()} /><Row label="Sponsor ID" value={user.sponsorId.toString()} /></div></Card>
            </div>
            <Card title="My Team">
              {team.length === 0 ? <Empty text="No direct registrations found yet." /> : <div className="teamList">{team.map(m => <div className="teamRow" key={m.id}><div><b>#{m.id}</b><span>{shortAddress(m.wallet)}</span></div><div><span>{statusLabel(m.status)}</span><small>Directs {m.directCount} • Active {m.activeDirectCount}</small></div></div>)}</div>}
            </Card>
          </PageSection>
        )}

        {section === "referral" && (
          <PageSection title="Referral Center" subtitle="Invite users with your sponsor wallet.">
            <Card title="Your Referral Link">
              <div className="refBox"><input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}?ref=${account}`} /><button className="primary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}?ref=${account}`)}>Copy Link</button></div>
              <div className="cards three mini"><Metric title="Sponsor ID" value={`#${user.sponsorId.toString()}`} sub="Your sponsor" /><Metric title="Direct Referrals" value={String(user.directCount)} sub="Registered directs" /><Metric title="Active Directs" value={String(user.activeDirectCount)} sub="Active directs" /></div>
            </Card>
            <Card title="Sponsor">
              {user.sponsorId === 0n ? <p className="muted">No sponsor.</p> : <div className="sponsorBox"><span>Sponsor ID</span><b>#{user.sponsorId.toString()}</b><code>{shortAddress(team.find(x => x.id === user.sponsorId.toString())?.wallet)}</code></div>}
            </Card>
          </PageSection>
        )}

        {section === "rank" && (
          <PageSection title="Rank Center" subtitle="Power Leg + Other Leg qualification.">
            <div className="rankHero"><div><span className="eyebrow">CURRENT RANK</span><strong>{rankLabel(currentRank)}</strong></div><div><span className="eyebrow">RANK WALLET</span><strong>{fmt(user.rankWallet)} USDT</strong></div></div>
            <div className="rankGrid dashRanks">{RANKS.map((r, i) => {
                            const unlocked = currentRank >= i + 1;
              return <div className={`rankCard ${unlocked ? "unlocked" : ""}`} key={r.name}><div className="rankBadge">{r.name}</div><h3>{r.reward.toLocaleString()} USDT</h3><p>Power {r.power.toLocaleString()} • Other {r.other.toLocaleString()}</p><Bar label="Power" value={user.powerLegBusiness} total={asBigInt(units(String(r.power)))} /><Bar label="Other" value={user.otherLegBusiness} total={asBigInt(units(String(r.other)))} /><small>{unlocked ? "✓ Achieved" : "Locked"}</small></div>
            })}</div>
            <Card title="Next Rank">
              <div className="nextRank"><b>{RANKS[Math.min(currentRank, 5)].name}</b><span>Reward {RANKS[Math.min(currentRank, 5)].reward.toLocaleString()} USDT</span><small>Power and Other Leg must both meet the requirement.</small></div>
            </Card>
          </PageSection>
        )}

        {section === "royalty" && (
          <PageSection title="Royalty Center" subtitle="Royalty qualification from business and active directs.">
            <div className="royaltyCurrent"><span>Current Royalty</span><strong>{royaltyLabel(royaltyLevel)}</strong></div>
            <div className="twoCol">
              {ROYALTIES.map((r, i) => <Card key={r.name} title={`Royalty ${r.name}`}><Row label="Lifetime Business" value={`${fmt(user.lifetimeBusiness)} / ${r.lifetime.toLocaleString()} USDT`} /><Row label="Rolling 30-Day Business" value={`${fmt(user.monthlyBusiness)} / ${r.monthly.toLocaleString()} USDT`} /><Row label="Active Directs" value={`${user.activeDirectCount} / ${r.directs}`} /><div className="progress"><i style={{ width: `${Math.min(100, Number(user.lifetimeBusiness * 100n / asBigInt(units(String(r.lifetime)))))}%` }} /></div></Card>)}
            </div>
            <Card title="Royalty History"><HistoryTable headers={["Level", "Amount", "Block"]}>{royaltyHistory.map((r, i) => <div className="tableRow" key={i}><span>{royaltyLabel(r.level)}</span><span>{fmt(r.amount)} USDT</span><span>#{r.blockNumber}</span></div>)}</HistoryTable></Card>
          </PageSection>
        )}

        {section === "withdraw" && (
          <PageSection title="Withdrawal Center" subtitle="Create a request. Release is manual by the authorized admin/withdrawal role.">
            <div className="cards three">
              <Metric title="Earning Wallet" value={`${fmt(user.earningWallet)} USDT`} sub="ROI + Level" />
              <Metric title="Rank Wallet" value={`${fmt(user.rankWallet)} USDT`} sub="Rank rewards" />
              <Metric title="Royalty Wallet" value={`${fmt(user.royaltyWallet)} USDT`} sub="Royalty income" />
            </div>
            <Card title="Request Withdrawal">
              <div className="withdrawForm">
                <label>Wallet</label>
                <select value={withdrawWallet} onChange={e => setWithdrawWallet(Number(e.target.value))}><option value={0}>Earning (ROI + Level)</option><option value={1}>Rank</option><option value={2}>Royalty</option></select>
                <label>Amount (USDT)</label>
                <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder={`Minimum ${config.minWithdrawal} USDT`} inputMode="decimal" />
                <div className="feePreview"><span>Fee</span><b>{withdrawAmount ? ((Number(withdrawAmount) * config.feeBps) / 10000).toFixed(2) : "0.00"} USDT</b><span>Estimated net</span><b>{withdrawAmount ? (Number(withdrawAmount) * (1 - config.feeBps / 10000)).toFixed(2) : "0.00"} USDT</b></div>
                <button className="primary full" disabled={busy} onClick={requestWithdrawal}>{busy ? "Processing..." : "Request Withdrawal"}</button>
                <p className="muted">Your request is stored on-chain. Funds are released manually after admin review.</p>
              </div>
            </Card>
          </PageSection>
        )}

        {section === "stakingHistory" && <HistoryPage title="Staking History"><HistoryTable headers={["Package", "Amount", "Max Payout", "Status"]}>{packages.map(p => <div className="tableRow" key={p.packageId}><span>#{p.packageId}</span><span>{fmt(p.amount)} USDT</span><span>{fmt(p.amount * 2n)} USDT</span><span className={p.closed ? "pill red" : "pill green"}>{p.closed ? "CLOSED" : "ACTIVE"}</span></div>)}</HistoryTable></HistoryPage>}
        {section === "withdrawHistory" && <HistoryPage title="Withdrawal History"><HistoryTable headers={["Request", "Wallet", "Amount", "Fee", "Net", "Status"]}>{withdrawals.map(w => <div className="tableRow" key={w.requestId}><span>#{w.requestId}</span><span>{walletTypeLabel(w.walletType)}</span><span>{fmt(w.amount)}</span><span>{fmt(w.fee)}</span><span>{fmt(w.netAmount)}</span><span className={`pill ${w.status === "APPROVED" ? "green" : w.status === "REJECTED" ? "red" : "yellow"}`}>{w.status}</span></div>)}</HistoryTable></HistoryPage>}
        {section === "rankHistory" && <HistoryPage title="Rank Reward History"><HistoryTable headers={["Rank", "Reward", "Block"]}>{rankHistory.map((r, i) => <div className="tableRow" key={i}><span>{rankLabel(r.rank)}</span><span>{fmt(r.reward)} USDT</span><span>#{r.blockNumber}</span></div>)}</HistoryTable></HistoryPage>}
        {section === "royaltyHistory" && <HistoryPage title="Royalty History"><HistoryTable headers={["Royalty", "Amount", "Block"]}>{royaltyHistory.map((r, i) => <div className="tableRow" key={i}><span>{royaltyLabel(r.level)}</span><span>{fmt(r.amount)} USDT</span><span>#{r.blockNumber}</span></div>)}</HistoryTable></HistoryPage>}

        {section === "profile" && (
          <PageSection title="Profile" subtitle="Your on-chain account information.">
            <Card title="Wallet">
              <div className="profileGrid">
                <Row label="Wallet Address" value={account} />
                <Row label="User ID" value={`#${user.id.toString()}`} />
                <Row label="Sponsor ID" value={`#${user.sponsorId.toString()}`} />
                <Row label="Registration Status" value={statusLabel(user.status)} />
                <Row label="Rank" value={rankLabel(user.rank)} />
                <Row label="Royalty" value={royaltyLabel(user.royalty)} />
                <Row label="Lifetime Withdrawn" value={`${fmt(user.totalWithdrawn)} USDT`} />
              </div>
              <div className="profileActions"><a href={explorerAddress(account)} target="_blank" rel="noreferrer" className="secondary">View Wallet ↗</a><a href={explorerAddress(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer" className="secondary">View Contract ↗</a></div>
            </Card>
          </PageSection>
        )}

        {!registered && (
          <div className="modalBack">
            <div className="modal">
              <img src="/orbi-logo.png" alt="ORBI" />
              <h2>Register on ORBIWORLD</h2>
              <p>Your wallet is connected but not registered.</p>
              <input value={sponsor} onChange={e => setSponsor(e.target.value)} placeholder="Sponsor wallet (optional)" />
              <button className="primary full" disabled={busy} onClick={registerUser}>{busy ? "Registering..." : "Register"}</button>
            </div>
          </div>
        )}
      </section>
      <Styles />
    </main>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <div className="sectionTitle"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

function sectionTitle(section: string) {
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    packages: "My Packages",
    business: "Business Center",
    referral: "Referral Center",
    rank: "Rank Center",
    royalty: "Royalty Center",
    withdraw: "Withdrawal Center",
    stakingHistory: "Staking History",
    withdrawHistory: "Withdrawal History",
    rankHistory: "Rank Reward History",
    royaltyHistory: "Royalty History",
    profile: "Profile",
  };
  return map[section] ?? "Dashboard";
}

function PageSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <div className="contentSection"><div className="pageHeading"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</div>;
}

function HistoryPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <PageSection title={title} subtitle="On-chain event history."><div className="tableCard">{children}</div></PageSection>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="panel"><div className="panelTitle">{title}</div>{children}</div>;
}

function Metric({ title, value, sub }: { title: string; value: string; sub: string }) {
  return <div className="metric"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="row"><span>{label}</span><b>{value}</b></div>;
}

function Bar({ label, value, total }: { label: string; value: bigint; total: bigint }) {
  const pct = total > 0n ? Math.min(100, Number((value * 100n) / total)) : 0;
  return <div className="barWrap"><div><span>{label}</span><b>{pct}%</b></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>;
}

function StakePanel({ user, config, amount, setAmount, activate, topUp, busy }: any) {
  const inactive = user.status !== 2;
  return <Card title={inactive ? "Activate First Package" : "Add New Package"}><div className="stakeForm"><input value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Amount in USDT (min ${inactive ? config.minStake : config.minTopup})`} inputMode="decimal" /><button className="primary" disabled={busy} onClick={inactive ? activate : topUp}>{busy ? "Processing..." : inactive ? "Approve & Activate" : "Approve & Top-up"}</button></div></Card>;
}

function HistoryTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div><div className="tableHead">{headers.map(h => <span key={h}>{h}</span>)}</div>{children || <Empty text="No history found." />}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

function Toast({ text }: { text: string }) {
  return <div className="toast">{text}</div>;
}

function Styles() {
  return <style jsx global>{`
    :root{--bg:#05060b;--panel:#0b0e16;--panel2:#101521;--line:rgba(255,255,255,.09);--text:#f8fafc;--muted:#98a2b3;--blue:#1688ff;--orange:#ff9b32;--green:#31d08a;--red:#ff5d67;--yellow:#f5c451}
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select{font:inherit}button{cursor:pointer}
    .site{min-height:100vh;background:radial-gradient(circle at 50% -10%,rgba(24,122,255,.16),transparent 36%),#05060b}.publicNav{height:74px;display:flex;align-items:center;justify-content:space-between;padding:0 6%;border-bottom:1px solid var(--line);background:rgba(5,6,11,.82);backdrop-filter:blur(18px);position:sticky;top:0;z-index:20}.brand,.sideBrand{display:flex;align-items:center;gap:12px}.brand img{width:42px;height:42px;object-fit:contain}.brand span{font-weight:800;letter-spacing:.18em}.navConnect,.primary{border:0;border-radius:12px;padding:12px 18px;color:white;background:linear-gradient(135deg,#1688ff,#7c4dff);box-shadow:0 12px 30px rgba(22,136,255,.2);font-weight:800}.secondary{border:1px solid var(--line);border-radius:12px;padding:11px 17px;color:var(--text);background:rgba(255,255,255,.03);font-weight:700;text-decoration:none}.hero{min-height:700px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:80px 20px;position:relative;overflow:hidden}.heroGlow{position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(24,136,255,.18),transparent 65%);filter:blur(5px)}.heroLogo{width:170px;height:170px;object-fit:contain;position:relative;filter:drop-shadow(0 0 34px rgba(27,138,255,.24));margin-bottom:24px}.eyebrow{font-size:11px;letter-spacing:.18em;color:#7fb9ff;font-weight:900}.hero h1{font-size:clamp(42px,7vw,82px);line-height:1.02;margin:18px 0 18px;letter-spacing:-.05em}.hero h1 span{background:linear-gradient(90deg,#fff,#65a8ff,#ffab4d);-webkit-background-clip:text;background-clip:text;color:transparent}.hero p{max-width:680px;color:var(--muted);font-size:18px}.heroActions{display:flex;gap:12px;margin-top:26px}.heroNote{margin-top:20px;color:#687386;font-size:12px}.section{max-width:1180px;margin:auto;padding:100px 24px}.section.dark{max-width:none;background:#080b12;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding-left:max(24px,calc((100% - 1132px)/2));padding-right:max(24px,calc((100% - 1132px)/2))}.sectionTitle{max-width:720px;margin-bottom:34px}.sectionTitle h2{font-size:42px;letter-spacing:-.035em;margin:10px 0}.sectionTitle p{color:var(--muted);line-height:1.7}.steps,.packageGrid,.rankGrid,.royaltyGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.step,.glassCard,.rankCard,.royaltyCard,.contractBox{border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));border-radius:18px;padding:24px}.step b{color:#5ca9ff}.step h3{margin:24px 0 8px}.step p,.glassCard small,.rankCard p,.royaltyCard span{color:var(--muted)}.glassCard{display:flex;flex-direction:column;gap:8px}.glassCard strong{font-size:27px}.flow{display:flex;gap:12px;flex-wrap:wrap}.flowItem{padding:18px 22px;border:1px solid var(--line);border-radius:16px;background:#0a0e16;display:flex;align-items:center;gap:10px}.flowItem span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#1688ff;font-size:12px}.rankGrid{grid-template-columns:repeat(3,1fr)}.rankCard h3{margin:14px 0 8px}.rankBadge{display:inline-flex;padding:7px 10px;border-radius:8px;background:rgba(22,136,255,.13);color:#71b7ff;font-weight:900}.royaltyGrid{grid-template-columns:repeat(2,1fr)}.royaltyCard{display:flex;flex-direction:column;gap:10px}.royaltyCard strong{font-size:34px}.contractBox{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:center}.contractBox span{display:block;color:var(--muted);font-size:12px;margin-bottom:6px}.contractBox a{color:#75b8ff;text-decoration:none}.faq{display:grid;gap:10px}.faq details{border:1px solid var(--line);border-radius:14px;padding:18px;background:#080b11}.faq summary{cursor:pointer;font-weight:800}.faq p{color:var(--muted);line-height:1.6}footer{text-align:center;padding:35px;color:#667085;border-top:1px solid var(--line)}
    .dashboardShell{min-height:100vh;display:grid;grid-template-columns:250px 1fr;background:#05060b}.sidebar{position:sticky;top:0;height:100vh;border-right:1px solid var(--line);background:#070911;padding:22px 14px;display:flex;flex-direction:column}.sideBrand img{width:42px;height:42px;object-fit:contain}.sideBrand b{display:block;letter-spacing:.08em}.sideBrand small{display:block;font-size:8px;letter-spacing:.16em;color:#697386;margin-top:2px}.sidebar nav{margin-top:30px;display:flex;flex-direction:column;gap:5px}.sidebar nav button{border:0;background:transparent;color:#8f9aab;text-align:left;padding:12px 13px;border-radius:10px;font-weight:700}.sidebar nav button:hover,.sidebar nav button.active{background:rgba(22,136,255,.11);color:#fff}.sideDivider{height:1px;background:var(--line);margin:10px 8px}.subnav{display:grid;gap:3px;padding:0 0 6px 12px}.subnav button{font-size:12px;padding:9px}.explorerSide{margin-top:auto;color:#78b8ff;text-decoration:none;font-size:12px;padding:12px}.dashMain{min-width:0;padding:26px 34px 60px}.dashTop{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:28px}.dashTop h1{font-size:30px;margin:7px 0 0}.walletChip{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:#0a0e16;padding:9px 10px 9px 12px;border-radius:14px}.walletChip b,.walletChip small{display:block}.walletChip small{color:var(--muted);font-size:10px;margin-top:2px}.walletChip button{border:1px solid var(--line);background:transparent;color:#fff;border-radius:8px;padding:6px 9px}.networkDot{width:8px;height:8px;border-radius:50%;background:#20d690;box-shadow:0 0 12px #20d690}.welcome{display:flex;justify-content:space-between;align-items:center;padding:28px;border-radius:20px;border:1px solid var(--line);background:radial-gradient(circle at 90% 0,rgba(255,155,50,.14),transparent 32%),linear-gradient(135deg,#0b111c,#0a0d14);margin-bottom:18px}.welcome h2{margin:8px 0}.welcome p{color:var(--muted);margin:0}.walletBalance{text-align:right}.walletBalance span{color:var(--muted);font-size:12px}.walletBalance strong{display:block;font-size:28px;margin-top:5px}.cards{display:grid;gap:14px;margin-bottom:18px}.cards.four{grid-template-columns:repeat(4,1fr)}.cards.three{grid-template-columns:repeat(3,1fr)}.cards.compact .metric{padding:18px}.cards.mini{margin-top:20px}.metric,.panel{border:1px solid var(--line);background:linear-gradient(180deg,#0b1019,#090c13);border-radius:17px}.metric{padding:22px;display:flex;flex-direction:column;gap:7px}.metric span{font-size:12px;color:#9ba6b6}.metric strong{font-size:25px}.metric small{color:#667085}.twoCol{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.panel{padding:22px;margin-bottom:16px}.panelTitle{font-weight:900;margin-bottom:18px}.row{display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.055)}.row:last-child{border-bottom:0}.row span{color:var(--muted)}.row b{font-weight:800;text-align:right}.statsList{display:grid}.qualify{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}.qualify div{border:1px solid var(--line);border-radius:12px;padding:14px}.qualify span{display:block;color:var(--muted);font-size:12px}.qualify strong{font-size:21px;margin-top:5px;display:block}.full{width:100%}.pageHeading{margin:5px 0 24px}.pageHeading h2{font-size:28px;margin:0 0 6px}.pageHeading p{color:var(--muted);margin:0}.stakeForm,.withdrawForm{display:grid;gap:12px}.stakeForm input,.withdrawForm input,.withdrawForm select,.refBox input,.modal input{width:100%;border:1px solid var(--line);background:#060810;color:#fff;border-radius:12px;padding:13px 14px;outline:none}.stakeForm{grid-template-columns:1fr auto}.withdrawForm label{font-size:12px;color:var(--muted)}.feePreview{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px;border-radius:12px;background:#070a11;border:1px solid var(--line)}.feePreview span{color:var(--muted)}.feePreview b{text-align:right}.tableCard{border:1px solid var(--line);border-radius:17px;overflow:hidden;background:#090c13}.tableHead,.tableRow{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:center;padding:15px 18px}.tableHead{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#788395;background:#070a10;border-bottom:1px solid var(--line)}.tableRow{border-bottom:1px solid rgba(255,255,255,.05);font-size:13px}.tableRow:last-child{border-bottom:0}.pill{display:inline-flex;width:max-content;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900}.pill.green{background:rgba(49,208,138,.12);color:#5ee7aa}.pill.red{background:rgba(255,93,103,.12);color:#ff8b92}.pill.yellow{background:rgba(245,196,81,.12);color:#ffd76d}.infoBanner{padding:14px;border:1px solid rgba(22,136,255,.18);background:rgba(22,136,255,.06);color:#9bcaff;border-radius:13px;margin-top:16px;font-size:13px}.legBars{display:grid;gap:20px}.barWrap>div:first-child{display:flex;justify-content:space-between;margin-bottom:7px;font-size:12px}.barWrap span{color:var(--muted)}.bar{height:8px;background:#161c27;border-radius:999px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#1688ff,#ff9b32);border-radius:999px}.teamList{display:grid;gap:8px}.teamRow{display:flex;justify-content:space-between;gap:16px;padding:14px;border:1px solid var(--line);border-radius:12px}.teamRow div{display:flex;flex-direction:column;gap:4px}.teamRow span,.teamRow small{color:var(--muted);font-size:11px}.refBox{display:grid;grid-template-columns:1fr auto;gap:10px}.sponsorBox{display:flex;gap:14px;align-items:center}.sponsorBox span{color:var(--muted)}.rankHero{display:flex;justify-content:space-between;padding:24px;border-radius:18px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(22,136,255,.12),rgba(255,155,50,.06));margin-bottom:18px}.rankHero strong{display:block;font-size:34px;margin-top:5px}.dashRanks{grid-template-columns:repeat(3,1fr);margin-bottom:16px}.dashRanks .rankCard{display:grid;gap:8px}.rankCard.unlocked{border-color:rgba(49,208,138,.28)}.nextRank{display:flex;flex-direction:column;gap:7px}.nextRank b{font-size:30px}.nextRank span,.nextRank small{color:var(--muted)}.royaltyCurrent{display:flex;justify-content:space-between;align-items:center;padding:26px;border:1px solid var(--line);border-radius:18px;background:#0b1018;margin-bottom:16px}.royaltyCurrent strong{font-size:40px;background:linear-gradient(90deg,#fff,#ffae54);-webkit-background-clip:text;color:transparent}.profileGrid{display:grid;gap:0}.profileActions{display:flex;gap:10px;margin-top:20px}.muted{color:var(--muted);line-height:1.6}.empty{padding:35px;text-align:center;color:var(--muted)}.toast{position:fixed;right:24px;bottom:24px;z-index:100;padding:13px 16px;border-radius:12px;border:1px solid var(--line);background:#111722;box-shadow:0 15px 40px rgba(0,0,0,.4);color:#fff;max-width:420px}.modalBack{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:90}.modal{width:min(430px,calc(100% - 30px));padding:28px;border:1px solid var(--line);border-radius:20px;background:#0a0e16;box-shadow:0 30px 80px rgba(0,0,0,.5)}.modal img{width:80px;height:80px;object-fit:contain}.modal h2{margin:12px 0 6px}.modal p{color:var(--muted);margin-bottom:18px}.modal{display:grid;gap:12px}
    @media(max-width:1000px){.dashboardShell{grid-template-columns:1fr}.sidebar{position:relative;height:auto;border-right:0;border-bottom:1px solid var(--line)}.sidebar nav{display:grid;grid-template-columns:repeat(2,1fr)}.explorerSide{display:none}.cards.four,.steps{grid-template-columns:repeat(2,1fr)}.dashRanks,.rankGrid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:680px){.publicNav{padding:0 18px}.hero{min-height:620px}.hero h1{font-size:48px}.heroActions{flex-direction:column;width:100%;max-width:320px}.section{padding:70px 18px}.steps,.packageGrid,.rankGrid,.royaltyGrid,.contractBox,.cards.four,.cards.three,.twoCol,.dashRanks{grid-template-columns:1fr}.dashMain{padding:20px 14px 40px}.dashTop,.welcome{align-items:flex-start;flex-direction:column}.walletBalance{text-align:left}.sidebar nav{grid-template-columns:1fr 1fr}.stakeForm,.refBox{grid-template-columns:1fr}.tableCard{overflow-x:auto}.tableHead,.tableRow{min-width:650px}.teamRow{flex-direction:column}.qualify{grid-template-columns:1fr}.heroLogo{width:130px;height:130px}}
  `}</style>;
}