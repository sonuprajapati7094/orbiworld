"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  BLOCK_EXPLORER,
  BSC_TESTNET_CHAIN_ID,
  getMocusdtReadContract,
  getMocusdtWriteContract,
  getOrbiWorldReadContract,
  getOrbiWorldWriteContract,
  isCorrectNetwork,
  parseUSDT,
  shortAddress,
  USER_STATUS,
  PACKAGE_STATUS,
} from "../../lib/contract";

// ERC20 spender for MOCUSDT approvals. This must match the deployed ORBI WORLD contract.
const ORBI_WORLD_SPENDER_ADDRESS = "0x3F2CaA8Ac8A922bD750ae91B0139a6c897C79c82";

/* =========================================================
   ORBI WORLD — DECENTRALIZED DASHBOARD
   Source of truth:
   - ORBI WORLD smart contract
   - MOCUSDT smart contract
   - Connected wallet
   No financial/user values are hardcoded.
========================================================= */

type WalletProvider = ethers.Eip1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => void;
};

type UserData = {
  id: bigint;
  wallet: string;
  sponsorId: bigint;
  status: bigint;
  directCount: bigint;
  activeDirectCount: bigint;
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
  rank: bigint;
  royalty: bigint;
};

type PackageData = {
  packageId: bigint;
  userId: bigint;
  amount: bigint;
  maxPayout: bigint;
  roiPaid: bigint;
  levelPaid: bigint;
  totalPaid: bigint;
  startTime: bigint;
  lastProcessedDay: bigint;
  closedTime: bigint;
  emergencyClosed: boolean;
  status: bigint;
  queueIndex: bigint;
  activeUserPackageIndex: bigint;
  exists: boolean;
};

type DashboardState = {
  user: UserData;
  packageIds: bigint[];
  activePackageIds: bigint[];
  directReferralIds: bigint[];
};

const EMPTY_USER: UserData = {
  id: 0n,
  wallet: ethers.ZeroAddress,
  sponsorId: 0n,
  status: 0n,
  directCount: 0n,
  activeDirectCount: 0n,
  lifetimeBusiness: 0n,
  monthlyBusiness: 0n,
  todayBusiness: 0n,
  powerLegBusiness: 0n,
  otherLegBusiness: 0n,
  earningWallet: 0n,
  rankWallet: 0n,
  royaltyWallet: 0n,
  totalROIIncome: 0n,
  totalLevelIncome: 0n,
  totalRankIncome: 0n,
  totalRoyaltyIncome: 0n,
  totalWithdrawn: 0n,
  rank: 0n,
  royalty: 0n,
};

const EMPTY_DASHBOARD: DashboardState = {
  user: EMPTY_USER,
  packageIds: [],
  activePackageIds: [],
  directReferralIds: [],
};

const toBigInt = (value: unknown): bigint => {
  try {
    return BigInt(value as string | number | bigint);
  } catch {
    return 0n;
  }
};

const normalizeUser = (value: any): UserData => ({
  id: toBigInt(value?.id ?? value?.[0]),
  wallet: String(value?.wallet ?? value?.[1] ?? ethers.ZeroAddress),
  sponsorId: toBigInt(value?.sponsorId ?? value?.[2]),
  status: toBigInt(value?.status ?? value?.[3]),
  directCount: toBigInt(value?.directCount ?? value?.[4]),
  activeDirectCount: toBigInt(value?.activeDirectCount ?? value?.[5]),
  lifetimeBusiness: toBigInt(value?.lifetimeBusiness ?? value?.[6]),
  monthlyBusiness: toBigInt(value?.monthlyBusiness ?? value?.[7]),
  todayBusiness: toBigInt(value?.todayBusiness ?? value?.[8]),
  powerLegBusiness: toBigInt(value?.powerLegBusiness ?? value?.[9]),
  otherLegBusiness: toBigInt(value?.otherLegBusiness ?? value?.[10]),
  earningWallet: toBigInt(value?.earningWallet ?? value?.[11]),
  rankWallet: toBigInt(value?.rankWallet ?? value?.[12]),
  royaltyWallet: toBigInt(value?.royaltyWallet ?? value?.[13]),
  totalROIIncome: toBigInt(value?.totalROIIncome ?? value?.[14]),
  totalLevelIncome: toBigInt(value?.totalLevelIncome ?? value?.[15]),
  totalRankIncome: toBigInt(value?.totalRankIncome ?? value?.[16]),
  totalRoyaltyIncome: toBigInt(value?.totalRoyaltyIncome ?? value?.[17]),
  totalWithdrawn: toBigInt(value?.totalWithdrawn ?? value?.[18]),
  rank: toBigInt(value?.rank ?? value?.[19]),
  royalty: toBigInt(value?.royalty ?? value?.[20]),
});

const normalizePackage = (value: any): PackageData => ({
  packageId: toBigInt(value?.packageId ?? value?.[0]),
  userId: toBigInt(value?.userId ?? value?.[1]),
  amount: toBigInt(value?.amount ?? value?.[2]),
  maxPayout: toBigInt(value?.maxPayout ?? value?.[3]),
  roiPaid: toBigInt(value?.roiPaid ?? value?.[4]),
  levelPaid: toBigInt(value?.levelPaid ?? value?.[5]),
  totalPaid: toBigInt(value?.totalPaid ?? value?.[6]),
  startTime: toBigInt(value?.startTime ?? value?.[7]),
  lastProcessedDay: toBigInt(value?.lastProcessedDay ?? value?.[8]),
  closedTime: toBigInt(value?.closedTime ?? value?.[9]),
  emergencyClosed: Boolean(value?.emergencyClosed ?? value?.[10]),
  status: toBigInt(value?.status ?? value?.[11]),
  queueIndex: toBigInt(value?.queueIndex ?? value?.[12]),
  activeUserPackageIndex: toBigInt(
    value?.activeUserPackageIndex ?? value?.[13]
  ),
  exists: Boolean(value?.exists ?? value?.[14]),
});

const formatUsdt = (value: bigint, max = 2) => {
  const raw = ethers.formatUnits(value, 18);
  const number = Number(raw);

  if (!Number.isFinite(number)) return "0.00";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: max,
  });
};

const formatInteger = (value: bigint) =>
  value.toLocaleString("en-US");

const statusLabel = (status: bigint) => {
  switch (Number(status)) {
    case USER_STATUS.ACTIVE:
      return "ACTIVE";
    case USER_STATUS.INACTIVE:
      return "INACTIVE";
    case USER_STATUS.EMERGENCY_EXIT:
      return "EMERGENCY EXIT";
    case USER_STATUS.BLACKLISTED:
      return "BLACKLISTED";
    default:
      return "NOT REGISTERED";
  }
};

const packageStatusLabel = (status: bigint, emergencyClosed: boolean) => {
  if (emergencyClosed) return "EMERGENCY CLOSED";
  if (Number(status) === PACKAGE_STATUS.CLOSED) return "CLOSED";
  return "ACTIVE";
};

const formatDate = (timestamp: bigint) => {
  if (timestamp <= 0n) return "—";

  const date = new Date(Number(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Icon({
  name,
  size = 19,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
        <path d="m4 12 8 4.5 8-4.5" />
        <path d="m4 16.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </>
    ),
    team: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3.5 20c.7-3.2 2.6-5 5.5-5s4.8 1.8 5.5 5" />
        <path d="M14 15.5c2.9-.1 4.9 1.4 5.5 4.5" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 7 20l1.1-1.1" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H4v1a4 4 0 0 0 4 4" />
        <path d="M16 6h4v1a4 4 0 0 1-4 4" />
        <path d="M12 12v5" />
        <path d="M8 21h8" />
        <path d="M9 17h6" />
      </>
    ),
    diamond: (
      <>
        <path d="m12 3 8 6-8 12L4 9l8-6Z" />
        <path d="m4 9 8 2 8-2" />
        <path d="m12 11 0 10" />
      </>
    ),
    money: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M7 8h.01M17 16h.01" />
      </>
    ),
    withdraw: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 9 17H3L12 3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6V11.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 6.7l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
    activity: (
      <>
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
        <path d="M4 7h14" />
        <path d="M16 13h4" />
        <circle cx="16" cy="13" r=".5" fill="currentColor" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L4 8" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14 5l2-2" />
        <path d="M20 20v-4h-4" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6" />
        <path d="m20 4-9 9" />
        <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] ?? paths.dashboard}</svg>;
}

const navItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "My Packages", icon: "package" },
  { label: "My Team", icon: "team" },
  { label: "Level Income", icon: "link" },
  { label: "Rank & Rewards", icon: "trophy" },
  { label: "Royalty", icon: "diamond" },
  { label: "Earnings", icon: "money" },
  { label: "Withdraw", icon: "withdraw" },
  { label: "Emergency Exit", icon: "alert", danger: true },
];

const utilityItems = [
  { label: "Settings", icon: "settings" },
  { label: "Referral", icon: "link" },
  { label: "Activity", icon: "activity" },
];

export default function Dashboard() {
  const [wallet, setWallet] = useState("");
  const [provider, setProvider] = useState<WalletProvider | null>(null);
  const [dashboard, setDashboard] =
    useState<DashboardState>(EMPTY_DASHBOARD);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [usdtBalance, setUsdtBalance] = useState<bigint>(0n);
  const [nativeBalance, setNativeBalance] = useState<bigint>(0n);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [error, setError] = useState("");

  // Stake / top-up modal state. The same modal handles first activation
  // and subsequent top-ups using the current on-chain account status.
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [minimumStake, setMinimumStake] = useState(0n);
  const [stakeBusy, setStakeBusy] = useState(false);
  const [stakeStep, setStakeStep] = useState<"idle" | "approving" | "staking">("idle");
  const [stakeMessage, setStakeMessage] = useState("");
  const [stakeTxHash, setStakeTxHash] = useState("");

  const loadDashboard = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;

    setLoading(true);
    setError("");
    setNetworkError("");

    try {
      const readContract = getOrbiWorldReadContract();
      const usdtContract = getMocusdtReadContract();

      const registered = await readContract.isRegistered(walletAddress);

      const [native, usdt] = await Promise.all([
        getReadBalance(walletAddress),
        usdtContract.balanceOf(walletAddress),
      ]);

      setNativeBalance(native);
      setUsdtBalance(usdt);

      if (!registered) {
        setDashboard(EMPTY_DASHBOARD);
        setPackages([]);
        setError(
          "This wallet is not registered in ORBI WORLD yet. Dashboard data will appear after on-chain registration."
        );
        return;
      }

      const data = await readContract.getDashboardData(
        await readContract.getUserId(walletAddress)
      );

      const normalized: DashboardState = {
        user: normalizeUser(data?.user ?? data?.[0]),
        packageIds: Array.from(data?.packageIds ?? data?.[1] ?? []).map(
          toBigInt
        ),
        activePackageIds: Array.from(
          data?.activePackageIds ?? data?.[2] ?? []
        ).map(toBigInt),
        directReferralIds: Array.from(
          data?.directReferralIds ?? data?.[3] ?? []
        ).map(toBigInt),
      };

      setDashboard(normalized);

      const packageResults = await Promise.all(
        normalized.packageIds.map(async (id) => {
          const result = await readContract.getPackage(id);
          return normalizePackage(result);
        })
      );

      setPackages(packageResults);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data from the blockchain."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function getReadBalance(address: string): Promise<bigint> {
    try {
      const readProvider = new ethers.JsonRpcProvider(
        "https://data-seed-prebsc-1-s1.bnbchain.org:8545"
      );
      return await readProvider.getBalance(address);
    } catch {
      return 0n;
    }
  }

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined") return;

    const ethereum = (window as Window & {
      ethereum?: WalletProvider;
    }).ethereum;

    if (!ethereum) {
      setError(
        "No compatible wallet detected. Install MetaMask or another EVM wallet."
      );
      return;
    }

    try {
      setError("");
      const browserProvider = new ethers.BrowserProvider(ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);

      if (!accounts?.[0]) return;

      const networkOk = await isCorrectNetwork(browserProvider);

      if (!networkOk) {
        setNetworkError(
          `Wrong network. Please switch your wallet to BNB Smart Chain Testnet (Chain ID ${BSC_TESTNET_CHAIN_ID}).`
        );
      }

      setProvider(ethereum);
      setWallet(accounts[0]);

      await loadDashboard(accounts[0]);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Wallet connection failed."
      );
    }
  }, [loadDashboard]);

  const openStakeModal = useCallback(async () => {
    if (!wallet) {
      setError("Connect your wallet before staking a package.");
      return;
    }

    try {
      setError("");
      setStakeMessage("");
      setStakeTxHash("");
      setStakeStep("idle");

      const readContract = getOrbiWorldReadContract();
      const config = await readContract.s_stakingConfig();
      const minimumStakeAmount = toBigInt(
        config?.minimumStake ?? config?.[0]
      );
      const minimumTopupAmount = toBigInt(
        config?.minimumTopup ?? config?.[1]
      );
      const minimum =
        dashboard.user.status === BigInt(USER_STATUS.ACTIVE)
          ? minimumTopupAmount
          : minimumStakeAmount;

      setMinimumStake(minimum);
      setStakeAmount(
        minimum > 0n ? ethers.formatUnits(minimum, 18) : ""
      );
      setStakeModalOpen(true);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load staking configuration."
      );
    }
  }, [wallet, dashboard.user.status]);

  const closeStakeModal = useCallback(() => {
    if (stakeBusy) return;
    setStakeModalOpen(false);
    setStakeMessage("");
    setStakeTxHash("");
    setStakeStep("idle");
  }, [stakeBusy]);

  const submitStake = useCallback(async () => {
    if (!wallet || !stakeAmount.trim()) {
      setStakeMessage("Enter a valid amount.");
      return;
    }

    if (!ethers.isAddress(wallet)) {
      setStakeMessage("Connected wallet address is invalid.");
      return;
    }

    let amount: bigint;
    try {
      amount = parseUSDT(stakeAmount.trim());
    } catch {
      setStakeMessage("Enter a valid MOCUSDT amount.");
      return;
    }

    if (amount <= 0n) {
      setStakeMessage("Amount must be greater than zero.");
      return;
    }

    if (minimumStake > 0n && amount < minimumStake) {
      setStakeMessage(
        `Minimum stake is $${formatUsdt(minimumStake)} MOCUSDT.`
      );
      return;
    }

    try {
      setStakeBusy(true);
      setStakeMessage("");
      setStakeTxHash("");

      const ethereum = (window as Window & {
        ethereum?: WalletProvider;
      }).ethereum;

      if (!ethereum) {
        throw new Error("No compatible wallet detected.");
      }

      const browserProvider = new ethers.BrowserProvider(ethereum);
      const networkOk = await isCorrectNetwork(browserProvider);

      if (!networkOk) {
        throw new Error(
          `Wrong network. Please switch to BNB Smart Chain Testnet (Chain ID ${BSC_TESTNET_CHAIN_ID}).`
        );
      }

      const signer = await browserProvider.getSigner();
      const signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== wallet.toLowerCase()) {
        throw new Error(
          "Connected wallet changed. Please reconnect the correct wallet and try again."
        );
      }

      const usdt = getMocusdtWriteContract(signer);
      const orbi = getOrbiWorldWriteContract(signer);

      const allowance = toBigInt(
        await usdt.allowance(signerAddress, ORBI_WORLD_SPENDER_ADDRESS)
      );

      if (allowance < amount) {
        setStakeStep("approving");
        setStakeMessage("Approve MOCUSDT spending in your wallet...");

        const approvalTx = await usdt.approve(
          ORBI_WORLD_SPENDER_ADDRESS,
          amount
        );
        setStakeTxHash(approvalTx.hash);
        await approvalTx.wait();
      }

      setStakeStep("staking");
      setStakeMessage(
        dashboard.user.status === BigInt(USER_STATUS.ACTIVE)
          ? "Submitting top-up transaction..."
          : "Submitting activation transaction..."
      );

      const tx =
        dashboard.user.status === BigInt(USER_STATUS.ACTIVE)
          ? await orbi.topUp(amount)
          : await orbi.activateAccount(amount);

      setStakeTxHash(tx.hash);
      await tx.wait();

      setStakeMessage("Transaction confirmed. Refreshing on-chain data...");
      await loadDashboard(wallet);

      setStakeBusy(false);
      setStakeStep("idle");
      setStakeModalOpen(false);
      setStakeMessage("");
      setStakeTxHash("");
    } catch (err) {
      console.error(err);
      setStakeBusy(false);
      setStakeStep("idle");
      setStakeMessage(
        err instanceof Error
          ? err.message
          : "Stake transaction failed. Please try again."
      );
    }
  }, [loadDashboard, minimumStake, stakeAmount, dashboard.user.status, wallet]);

  const refresh = useCallback(async () => {
    if (!wallet) return;
    await loadDashboard(wallet);
  }, [loadDashboard, wallet]);

  useEffect(() => {
    const saved = window.localStorage.getItem("orbi.dashboard.wallet");
    if (saved && ethers.isAddress(saved)) {
      setWallet(saved);
      loadDashboard(saved);
    }
  }, [loadDashboard]);

  useEffect(() => {
    if (wallet) {
      window.localStorage.setItem("orbi.dashboard.wallet", wallet);
    }
  }, [wallet]);

  useEffect(() => {
    if (!provider?.on) return;

    const handleAccounts = (accounts: unknown) => {
      const next = Array.isArray(accounts) ? String(accounts[0] ?? "") : "";

      if (!next) {
        setWallet("");
        setDashboard(EMPTY_DASHBOARD);
        setPackages([]);
        return;
      }

      setWallet(next);
      loadDashboard(next);
    };

    const handleChain = () => {
      if (wallet) loadDashboard(wallet);
    };

    provider.on("accountsChanged", handleAccounts);
    provider.on("chainChanged", handleChain);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccounts);
      provider.removeListener?.("chainChanged", handleChain);
    };
  }, [provider, wallet, loadDashboard]);

  const user = dashboard.user;

  const activePackages = useMemo(
    () =>
      packages.filter(
        (item) =>
          dashboard.activePackageIds.some(
            (id) => id.toString() === item.packageId.toString()
          ) && item.status === BigInt(PACKAGE_STATUS.ACTIVE)
      ),
    [dashboard.activePackageIds, packages]
  );

  const totalStaked = packages.reduce(
    (sum, item) => sum + item.amount,
    0n
  );

  const totalPackagePaid = packages.reduce(
    (sum, item) => sum + item.totalPaid,
    0n
  );

  const totalEarnings =
    user.totalROIIncome +
    user.totalLevelIncome +
    user.totalRankIncome +
    user.totalRoyaltyIncome;

  const referralLink =
    typeof window !== "undefined" && wallet
      ? `${window.location.origin}/?ref=${wallet}`
      : "";

  const copyReferral = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Unable to copy referral link.");
    }
  };

  const emergencyEligiblePackages = activePackages.filter((item) => {
    const threshold = (item.amount * 70n) / 100n;
    return item.totalPaid < threshold;
  });

  const renderMain = () => {
    if (activeNav === "My Packages") {
      const activeCount = activePackages.length;
      const closedCount = packages.filter(
        (item) => item.status === BigInt(PACKAGE_STATUS.CLOSED)
      ).length;

      return (
        <>
          <section className="orbi-welcome">
            <div>
              <div className="orbi-eyebrow">
                <span className="orbi-live-dot" />
                ON-CHAIN PACKAGES
              </div>
              <h1>My Packages<span>.</span></h1>
              <p>
                Every package below is loaded directly from the ORBI WORLD
                smart contract for the connected wallet.
              </p>
            </div>

            <div className="orbi-package-actions">
              <button
                className="orbi-stake-btn"
                onClick={openStakeModal}
                disabled={!wallet || loading}
              >
                <Icon name="package" size={18} />
                {user.status === BigInt(USER_STATUS.ACTIVE)
                  ? "Top Up Package"
                  : "Stake Package"}
              </button>
              <button
                className="orbi-refresh-btn"
                onClick={refresh}
                disabled={loading}
              >
                <Icon name="refresh" size={17} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </section>

          {networkError && (
            <div className="orbi-alert orbi-alert-warning">
              <Icon name="alert" size={18} />
              <span>{networkError}</span>
            </div>
          )}

          {error && (
            <div className="orbi-alert">
              <Icon name="alert" size={18} />
              <span>{error}</span>
            </div>
          )}

          {!wallet ? (
            <section className="orbi-connect-panel">
              <div className="orbi-connect-art">
                <Icon name="wallet" size={34} />
              </div>
              <div className="orbi-connect-copy">
                <div className="orbi-section-kicker">WALLET REQUIRED</div>
                <h2>Connect your wallet</h2>
                <p>
                  Connect the wallet that owns your ORBI WORLD account to load
                  your packages from the blockchain.
                </p>
              </div>
              <button className="orbi-primary-btn" onClick={connectWallet}>
                <Icon name="wallet" size={18} />
                Connect Wallet
              </button>
            </section>
          ) : (
            <>
              <section className="orbi-package-overview-grid">
                <div>
                  <span>TOTAL PACKAGES</span>
                  <strong>{packages.length}</strong>
                  <small>All on-chain packages</small>
                </div>
                <div>
                  <span>ACTIVE PACKAGES</span>
                  <strong>{activeCount}</strong>
                  <small>Currently active</small>
                </div>
                <div>
                  <span>CLOSED PACKAGES</span>
                  <strong>{closedCount}</strong>
                  <small>Completed or closed</small>
                </div>
                <div>
                  <span>TOTAL STAKED</span>
                  <strong>${formatUsdt(totalStaked)}</strong>
                  <small>Contract package amount</small>
                </div>
              </section>

              <section className="orbi-card orbi-package-section orbi-packages-page">
                <div className="orbi-card-head">
                  <div>
                    <span className="orbi-section-kicker">PACKAGE PORTFOLIO</span>
                    <h2>Your on-chain packages</h2>
                    <p>
                      Package IDs and financial values are read from the smart
                      contract. Nothing is manually stored in the frontend.
                    </p>
                  </div>
                  <div className="orbi-package-summary">
                    <span>TOTAL PAID</span>
                    <strong>${formatUsdt(totalPackagePaid)}</strong>
                  </div>
                </div>

                {loading && packages.length === 0 ? (
                  <div className="orbi-no-data">
                    <Icon name="refresh" size={24} />
                    <span>Loading packages from blockchain...</span>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="orbi-no-data">
                    <Icon name="package" size={24} />
                    <span>No packages found for this wallet.</span>
                    <small>Stake a package and refresh to see it here.</small>
                  </div>
                ) : (
                  <div className="orbi-package-grid orbi-package-grid-page">
                    {packages.map((item) => {
                      const threshold = (item.amount * 70n) / 100n;
                      const progress =
                        item.maxPayout > 0n
                          ? Math.min(
                              100,
                              Number(
                                (item.totalPaid * 10000n) / item.maxPayout
                              ) / 100
                            )
                          : 0;
                      const emergencyEligible =
                        item.status === BigInt(PACKAGE_STATUS.ACTIVE) &&
                        !item.emergencyClosed &&
                        item.totalPaid < threshold;

                      return (
                        <article
                          className={`orbi-package-item orbi-package-page-item ${
                            item.status === BigInt(PACKAGE_STATUS.ACTIVE)
                              ? "is-active"
                              : ""
                          }`}
                          key={item.packageId.toString()}
                        >
                          <div className="orbi-package-top">
                            <div>
                              <span>PACKAGE ID</span>
                              <strong>#{item.packageId.toString()}</strong>
                            </div>
                            <span
                              className={`orbi-package-status ${
                                item.status === BigInt(PACKAGE_STATUS.ACTIVE)
                                  ? "active"
                                  : "closed"
                              }`}
                            >
                              {packageStatusLabel(
                                item.status,
                                item.emergencyClosed
                              )}
                            </span>
                          </div>

                          <div className="orbi-package-amount">
                            <span>STAKED AMOUNT</span>
                            <strong>${formatUsdt(item.amount)}</strong>
                          </div>

                          <div className="orbi-package-detail-row">
                            <div>
                              <span>MAX PAYOUT</span>
                              <b>${formatUsdt(item.maxPayout)}</b>
                            </div>
                            <div>
                              <span>TOTAL PAID</span>
                              <b>${formatUsdt(item.totalPaid)}</b>
                            </div>
                          </div>

                          <div className="orbi-progress-wrap">
                            <div className="orbi-progress-label">
                              <span>2X PAYOUT PROGRESS</span>
                              <b>{progress.toFixed(1)}%</b>
                            </div>
                            <div className="orbi-progress">
                              <span style={{ width: `${progress}%` }} />
                            </div>
                            <div className="orbi-progress-values">
                              <span>${formatUsdt(item.totalPaid)} paid</span>
                              <span>${formatUsdt(item.maxPayout)} max</span>
                            </div>
                          </div>

                          <div className="orbi-package-stats">
                            <div>
                              <span>ROI PAID</span>
                              <b>${formatUsdt(item.roiPaid)}</b>
                            </div>
                            <div>
                              <span>LEVEL PAID</span>
                              <b>${formatUsdt(item.levelPaid)}</b>
                            </div>
                            <div>
                              <span>STARTED</span>
                              <b>{formatDate(item.startTime)}</b>
                            </div>
                          </div>

                          <div className="orbi-package-meta-grid">
                            <div>
                              <span>CLOSED</span>
                              <b>{formatDate(item.closedTime)}</b>
                            </div>
                            <div>
                              <span>EMERGENCY CLOSED</span>
                              <b>{item.emergencyClosed ? "YES" : "NO"}</b>
                            </div>
                          </div>

                          <div
                            className={`orbi-emergency-status ${
                              emergencyEligible ? "eligible" : "locked"
                            }`}
                          >
                            <div>
                              <span>EMERGENCY EXIT ELIGIBILITY</span>
                              <strong>
                                {emergencyEligible ? "ELIGIBLE" : "LOCKED"}
                              </strong>
                            </div>
                            <small>
                              70% threshold: ${formatUsdt(threshold)}
                            </small>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      );
    }

    if (activeNav !== "Dashboard") {
      return (
        <section className="orbi-empty-section">
          <div className="orbi-empty-icon">
            <Icon
              name={
                navItems.find((item) => item.label === activeNav)?.icon ??
                utilityItems.find((item) => item.label === activeNav)?.icon ??
                "dashboard"
              }
              size={25}
            />
          </div>
          <h2>{activeNav}</h2>
          <p>
            This module is connected to the same on-chain dashboard foundation.
            We will wire its dedicated contract reads and transactions in the
            next implementation step.
          </p>
        </section>
      );
    }

    return (
      <>
        <section className="orbi-welcome">
          <div>
            <div className="orbi-eyebrow">
              <span className="orbi-live-dot" />
              DECENTRALIZED DASHBOARD
            </div>
            <h1>
              Welcome back<span>.</span>
            </h1>
            <p>
              Your ORBI WORLD ecosystem overview, powered directly by the
              blockchain.
            </p>
          </div>

          <button className="orbi-refresh-btn" onClick={refresh} disabled={loading}>
            <Icon name="refresh" size={17} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {networkError && (
          <div className="orbi-alert orbi-alert-warning">
            <Icon name="alert" size={18} />
            <span>{networkError}</span>
          </div>
        )}

        {error && (
          <div className="orbi-alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </div>
        )}

        {!wallet && (
          <section className="orbi-connect-panel">
            <div className="orbi-connect-art">
              <Icon name="wallet" size={34} />
            </div>
            <div className="orbi-connect-copy">
              <div className="orbi-section-kicker">WALLET REQUIRED</div>
              <h2>Connect your wallet</h2>
              <p>
                Connect the wallet that owns your ORBI WORLD account to load
                your real on-chain dashboard data.
              </p>
            </div>
            <button className="orbi-primary-btn" onClick={connectWallet}>
              <Icon name="wallet" size={18} />
              Connect Wallet
            </button>
          </section>
        )}

        {wallet && (
          <>
            <section className="orbi-wallet-bar">
              <div className="orbi-wallet-left">
                <div className="orbi-wallet-status" />
                <div>
                  <span>CONNECTED WALLET</span>
                  <strong>{shortAddress(wallet)}</strong>
                </div>
              </div>

              <a
                href={`${BLOCK_EXPLORER}/address/${wallet}`}
                target="_blank"
                rel="noreferrer"
                className="orbi-explorer-link"
              >
                View on BscScan
                <Icon name="external" size={15} />
              </a>
            </section>

            <section className="orbi-stat-grid">
              <StatCard
                icon="package"
                label="TOTAL STAKED"
                value={`$${formatUsdt(totalStaked)}`}
                meta={`${packages.length} total package${packages.length === 1 ? "" : "s"}`}
              />
              <StatCard
                icon="dashboard"
                label="ACTIVE PACKAGES"
                value={formatInteger(BigInt(activePackages.length))}
                meta={`${dashboard.activePackageIds.length} on-chain active`}
              />
              <StatCard
                icon="money"
                label="TOTAL EARNINGS"
                value={`$${formatUsdt(totalEarnings)}`}
                meta="ROI + level + rank + royalty"
              />
              <StatCard
                icon="team"
                label="DIRECT REFERRALS"
                value={formatInteger(user.directCount)}
                meta={`${formatInteger(user.activeDirectCount)} active directs`}
              />
            </section>

            <section className="orbi-two-column">
              <div className="orbi-card orbi-wallet-card">
                <div className="orbi-card-head">
                  <div>
                    <span className="orbi-section-kicker">WALLET OVERVIEW</span>
                    <h2>On-chain balances</h2>
                  </div>
                  <Icon name="wallet" size={22} />
                </div>

                <div className="orbi-balance-grid">
                  <div>
                    <span>MOCUSDT BALANCE</span>
                    <strong>${formatUsdt(usdtBalance)}</strong>
                  </div>
                  <div>
                    <span>BNB BALANCE</span>
                    <strong>{Number(ethers.formatEther(nativeBalance)).toFixed(4)} BNB</strong>
                  </div>
                  <div>
                    <span>ACCOUNT STATUS</span>
                    <strong className="orbi-status-text">
                      {statusLabel(user.status)}
                    </strong>
                  </div>
                  <div>
                    <span>USER ID</span>
                    <strong>#{formatInteger(user.id)}</strong>
                  </div>
                </div>
              </div>

              <div className="orbi-card orbi-income-card">
                <div className="orbi-card-head">
                  <div>
                    <span className="orbi-section-kicker">EARNINGS</span>
                    <h2>Income breakdown</h2>
                  </div>
                  <Icon name="money" size={22} />
                </div>

                <div className="orbi-income-list">
                  <IncomeRow label="ROI Income" value={user.totalROIIncome} />
                  <IncomeRow
                    label="Level Income"
                    value={user.totalLevelIncome}
                  />
                  <IncomeRow
                    label="Rank Income"
                    value={user.totalRankIncome}
                  />
                  <IncomeRow
                    label="Royalty Income"
                    value={user.totalRoyaltyIncome}
                  />
                </div>
              </div>
            </section>

            <section className="orbi-card orbi-package-section">
              <div className="orbi-card-head">
                <div>
                  <span className="orbi-section-kicker">STAKING</span>
                  <h2>My Packages</h2>
                  <p>
                    Every value below is read from the ORBI WORLD contract.
                  </p>
                </div>
                <div className="orbi-package-summary">
                  <span>ON-CHAIN PAID</span>
                  <strong>${formatUsdt(totalPackagePaid)}</strong>
                </div>
              </div>

              {packages.length === 0 ? (
                <div className="orbi-no-data">
                  <Icon name="package" size={24} />
                  <span>No packages found for this wallet.</span>
                </div>
              ) : (
                <div className="orbi-package-grid">
                  {packages.map((item) => {
                    const threshold = (item.amount * 70n) / 100n;
                    const progress =
                      item.maxPayout > 0n
                        ? Math.min(
                            100,
                            Number(
                              (item.totalPaid * 10000n) / item.maxPayout
                            ) / 100
                          )
                        : 0;

                    const emergencyEligible =
                      item.status === BigInt(PACKAGE_STATUS.ACTIVE) &&
                      item.totalPaid < threshold;

                    return (
                      <article
                        className={`orbi-package-item ${
                          item.status === BigInt(PACKAGE_STATUS.ACTIVE)
                            ? "is-active"
                            : ""
                        }`}
                        key={item.packageId.toString()}
                      >
                        <div className="orbi-package-top">
                          <div>
                            <span>PACKAGE</span>
                            <strong>#{item.packageId.toString()}</strong>
                          </div>
                          <span
                            className={`orbi-package-status ${
                              item.status === BigInt(PACKAGE_STATUS.ACTIVE)
                                ? "active"
                                : "closed"
                            }`}
                          >
                            {packageStatusLabel(
                              item.status,
                              item.emergencyClosed
                            )}
                          </span>
                        </div>

                        <div className="orbi-package-amount">
                          <span>STAKED AMOUNT</span>
                          <strong>${formatUsdt(item.amount)}</strong>
                        </div>

                        <div className="orbi-progress-wrap">
                          <div className="orbi-progress-label">
                            <span>2X PAYOUT PROGRESS</span>
                            <b>{progress.toFixed(1)}%</b>
                          </div>
                          <div className="orbi-progress">
                            <span style={{ width: `${progress}%` }} />
                          </div>
                          <div className="orbi-progress-values">
                            <span>${formatUsdt(item.totalPaid)} paid</span>
                            <span>${formatUsdt(item.maxPayout)} max</span>
                          </div>
                        </div>

                        <div className="orbi-package-stats">
                          <div>
                            <span>ROI PAID</span>
                            <b>${formatUsdt(item.roiPaid)}</b>
                          </div>
                          <div>
                            <span>LEVEL PAID</span>
                            <b>${formatUsdt(item.levelPaid)}</b>
                          </div>
                          <div>
                            <span>STARTED</span>
                            <b>{formatDate(item.startTime)}</b>
                          </div>
                        </div>

                        <div
                          className={`orbi-emergency-status ${
                            emergencyEligible ? "eligible" : "locked"
                          }`}
                        >
                          <div>
                            <span>EMERGENCY EXIT</span>
                            <strong>
                              {emergencyEligible ? "ELIGIBLE" : "LOCKED"}
                            </strong>
                          </div>
                          <small>
                            70% threshold: ${formatUsdt(threshold)}
                          </small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="orbi-two-column">
              <div className="orbi-card">
                <div className="orbi-card-head">
                  <div>
                    <span className="orbi-section-kicker">NETWORK</span>
                    <h2>Your network</h2>
                  </div>
                  <Icon name="team" size={22} />
                </div>

                <div className="orbi-network-grid">
                  <div>
                    <span>DIRECTS</span>
                    <strong>{formatInteger(user.directCount)}</strong>
                  </div>
                  <div>
                    <span>ACTIVE DIRECTS</span>
                    <strong>{formatInteger(user.activeDirectCount)}</strong>
                  </div>
                  <div>
                    <span>TEAM BUSINESS</span>
                    <strong>${formatUsdt(user.lifetimeBusiness)}</strong>
                  </div>
                  <div>
                    <span>POWER LEG</span>
                    <strong>${formatUsdt(user.powerLegBusiness)}</strong>
                  </div>
                </div>
              </div>

              <div className="orbi-card orbi-rank-card">
                <div className="orbi-card-head">
                  <div>
                    <span className="orbi-section-kicker">ACHIEVEMENT</span>
                    <h2>Rank & Royalty</h2>
                  </div>
                  <Icon name="trophy" size={22} />
                </div>

                <div className="orbi-achievement-row">
                  <div className="orbi-achievement">
                    <span>CURRENT RANK</span>
                    <strong>RANK {user.rank.toString()}</strong>
                  </div>
                  <div className="orbi-achievement">
                    <span>ROYALTY LEVEL</span>
                    <strong>{user.royalty.toString()}</strong>
                  </div>
                </div>

                <div className="orbi-achievement-wallets">
                  <div>
                    <span>RANK WALLET</span>
                    <b>${formatUsdt(user.rankWallet)}</b>
                  </div>
                  <div>
                    <span>ROYALTY WALLET</span>
                    <b>${formatUsdt(user.royaltyWallet)}</b>
                  </div>
                </div>
              </div>
            </section>

            <section className="orbi-card orbi-referral-card">
              <div className="orbi-card-head">
                <div>
                  <span className="orbi-section-kicker">NETWORK GROWTH</span>
                  <h2>Your referral link</h2>
                  <p>Share your wallet-linked referral URL.</p>
                </div>
                <Icon name="link" size={22} />
              </div>

              <div className="orbi-referral-row">
                <div className="orbi-referral-input">
                  <span>{referralLink || "Connect wallet to generate link"}</span>
                </div>
                <button
                  className="orbi-copy-btn"
                  onClick={copyReferral}
                  disabled={!referralLink}
                >
                  <Icon name="copy" size={17} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </section>

            <section className="orbi-card orbi-activity-card">
              <div className="orbi-card-head">
                <div>
                  <span className="orbi-section-kicker">ACCOUNT</span>
                  <h2>Activity overview</h2>
                </div>
                <Icon name="activity" size={22} />
              </div>

              <div className="orbi-activity-grid">
                <div>
                  <span>LIFETIME BUSINESS</span>
                  <strong>${formatUsdt(user.lifetimeBusiness)}</strong>
                </div>
                <div>
                  <span>MONTHLY BUSINESS</span>
                  <strong>${formatUsdt(user.monthlyBusiness)}</strong>
                </div>
                <div>
                  <span>TODAY BUSINESS</span>
                  <strong>${formatUsdt(user.todayBusiness)}</strong>
                </div>
                <div>
                  <span>TOTAL WITHDRAWN</span>
                  <strong>${formatUsdt(user.totalWithdrawn)}</strong>
                </div>
              </div>

              <div className="orbi-activity-foot">
                <span>
                  {emergencyEligiblePackages.length} active package
                  {emergencyEligiblePackages.length === 1 ? "" : "s"} currently
                  below the 70% emergency-exit threshold.
                </span>
                <a
                  href={`${BLOCK_EXPLORER}/address/${wallet}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open wallet on explorer
                  <Icon name="external" size={14} />
                </a>
              </div>
            </section>
          </>
        )}
      </>
    );
  };

  return (
    <main className="orbi-dashboard">
      <style jsx global>{`
        .orbi-dashboard {
          --od-bg: #030508;
          --od-surface: #0a0f18;
          --od-surface-2: #0e1522;
          --od-border: #1c2a3d;
          --od-border-light: #263750;
          --od-primary: #168cff;
          --od-purple: #7357ff;
          --od-orange: #ff9d32;
          --od-text: #f8fafc;
          --od-muted: #8b9bb0;
          --od-muted-2: #5f7087;
          --od-success: #22c55e;
          --od-danger: #ef4444;
          min-height: 100vh;
          display: flex;
          color: var(--od-text);
          background:
            radial-gradient(circle at 78% 8%, rgba(115, 87, 255, 0.09), transparent 25%),
            radial-gradient(circle at 28% 15%, rgba(22, 140, 255, 0.08), transparent 28%),
            var(--od-bg);
          font-family: Arial, Helvetica, sans-serif;
        }

        .orbi-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 50;
          width: 250px;
          padding: 22px 14px 18px;
          display: flex;
          flex-direction: column;
          background: rgba(7, 11, 18, 0.94);
          border-right: 1px solid var(--od-border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .orbi-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 4px 10px 24px;
          border-bottom: 1px solid rgba(38, 55, 80, 0.55);
          margin-bottom: 15px;
        }

        .orbi-brand-mark {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: linear-gradient(135deg, var(--od-primary), var(--od-purple), var(--od-orange));
          box-shadow: 0 0 26px rgba(22, 140, 255, 0.2);
          font-size: 14px;
          font-weight: 900;
          color: #fff;
        }

        .orbi-brand-name {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .orbi-brand-sub {
          margin-top: 3px;
          color: var(--od-muted-2);
          font-size: 9px;
          letter-spacing: 0.15em;
          font-weight: 700;
        }

        .orbi-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .orbi-nav-button {
          width: 100%;
          min-height: 43px;
          border: 1px solid transparent;
          border-radius: 11px;
          background: transparent;
          color: var(--od-muted);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          text-align: left;
          transition: 180ms ease;
        }

        .orbi-nav-button:hover {
          color: #fff;
          background: rgba(22, 140, 255, 0.06);
          border-color: rgba(38, 55, 80, 0.8);
        }

        .orbi-nav-button.active {
          color: #fff;
          background: linear-gradient(90deg, rgba(22, 140, 255, 0.13), rgba(115, 87, 255, 0.08));
          border-color: rgba(22, 140, 255, 0.2);
          box-shadow: inset 2px 0 0 var(--od-primary);
        }

        .orbi-nav-button.danger {
          color: #d38a8a;
        }

        .orbi-nav-button.danger.active,
        .orbi-nav-button.danger:hover {
          color: #fff;
          border-color: rgba(239, 68, 68, 0.18);
          background: rgba(239, 68, 68, 0.06);
          box-shadow: inset 2px 0 0 var(--od-danger);
        }

        .orbi-nav-divider {
          height: 1px;
          background: rgba(38, 55, 80, 0.55);
          margin: 12px 8px;
        }

        .orbi-sidebar-bottom {
          margin-top: auto;
          padding-top: 12px;
          color: var(--od-muted-2);
          font-size: 9px;
          line-height: 1.5;
          letter-spacing: 0.08em;
        }

        .orbi-mobile-top {
          display: none;
        }

        .orbi-main {
          width: calc(100% - 250px);
          margin-left: 250px;
          min-height: 100vh;
          padding: 34px 38px 50px;
        }

        .orbi-main-inner {
          width: min(100%, 1420px);
          margin: 0 auto;
        }

        .orbi-welcome {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 25px;
        }

        .orbi-eyebrow,
        .orbi-section-kicker {
          color: var(--od-muted-2);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.17em;
        }

        .orbi-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }

        .orbi-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--od-success);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.7);
        }

        .orbi-welcome h1 {
          margin: 0;
          font-size: clamp(30px, 3vw, 44px);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .orbi-welcome h1 span {
          color: var(--od-primary);
        }

        .orbi-welcome p {
          margin: 10px 0 0;
          max-width: 600px;
          color: var(--od-muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .orbi-refresh-btn,
        .orbi-primary-btn,
        .orbi-copy-btn {
          border: 1px solid var(--od-border-light);
          color: #fff;
          background: rgba(14, 21, 34, 0.9);
          border-radius: 11px;
          min-height: 42px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          transition: 180ms ease;
        }

        .orbi-refresh-btn:hover,
        .orbi-copy-btn:hover {
          border-color: rgba(22, 140, 255, 0.45);
          background: rgba(22, 140, 255, 0.08);
        }

        .orbi-refresh-btn:disabled,
        .orbi-copy-btn:disabled,
        .orbi-primary-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .orbi-primary-btn {
          border-color: rgba(22, 140, 255, 0.5);
          background: linear-gradient(135deg, rgba(22, 140, 255, 0.95), rgba(115, 87, 255, 0.95));
          box-shadow: 0 12px 30px rgba(22, 140, 255, 0.16);
        }

        .orbi-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 15px 36px rgba(22, 140, 255, 0.22);
        }

        .orbi-alert {
          min-height: 48px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 0 15px;
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.055);
          color: #fca5a5;
          font-size: 13px;
        }

        .orbi-alert-warning {
          border-color: rgba(255, 157, 50, 0.25);
          background: rgba(255, 157, 50, 0.05);
          color: #fdba74;
        }

        .orbi-connect-panel,
        .orbi-wallet-bar,
        .orbi-card {
          border: 1px solid var(--od-border);
          background: rgba(10, 15, 24, 0.78);
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.14);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .orbi-connect-panel {
          min-height: 150px;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          border-radius: 18px;
          margin-bottom: 22px;
        }

        .orbi-connect-art {
          width: 64px;
          height: 64px;
          flex: 0 0 64px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          color: #fff;
          background: linear-gradient(135deg, rgba(22, 140, 255, 0.16), rgba(115, 87, 255, 0.13));
          border: 1px solid rgba(22, 140, 255, 0.2);
        }

        .orbi-connect-copy {
          flex: 1;
        }

        .orbi-connect-copy h2 {
          margin: 5px 0 6px;
          font-size: 20px;
        }

        .orbi-connect-copy p {
          margin: 0;
          color: var(--od-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .orbi-wallet-bar {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 0 16px;
          margin-bottom: 14px;
          border-radius: 13px;
        }

        .orbi-wallet-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .orbi-wallet-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--od-success);
          box-shadow: 0 0 13px rgba(34, 197, 94, 0.75);
        }

        .orbi-wallet-left span {
          display: block;
          color: var(--od-muted-2);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .orbi-wallet-left strong {
          display: block;
          margin-top: 2px;
          font-size: 13px;
        }

        .orbi-explorer-link,
        .orbi-activity-foot a {
          color: #9bcfff;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .orbi-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 14px;
        }

        .orbi-stat {
          min-height: 145px;
          padding: 18px;
          border: 1px solid var(--od-border);
          border-radius: 15px;
          background: linear-gradient(145deg, rgba(14, 21, 34, 0.92), rgba(8, 13, 21, 0.82));
          position: relative;
          overflow: hidden;
        }

        .orbi-stat::after {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          right: -45px;
          top: -45px;
          border-radius: 50%;
          background: rgba(22, 140, 255, 0.08);
          filter: blur(10px);
        }

        .orbi-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #9bcfff;
          background: rgba(22, 140, 255, 0.08);
          border: 1px solid rgba(22, 140, 255, 0.14);
          margin-bottom: 18px;
        }

        .orbi-stat-label {
          color: var(--od-muted-2);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.15em;
        }

        .orbi-stat-value {
          margin-top: 6px;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .orbi-stat-meta {
          margin-top: 5px;
          color: var(--od-muted);
          font-size: 10px;
        }

        .orbi-two-column {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
          gap: 14px;
          margin-bottom: 14px;
        }

        .orbi-card {
          border-radius: 16px;
          padding: 20px;
        }

        .orbi-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .orbi-card-head > svg,
        .orbi-card-head > div:last-child > svg {
          color: #6fbaff;
        }

        .orbi-card h2 {
          margin: 5px 0 0;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .orbi-card-head p {
          margin: 6px 0 0;
          color: var(--od-muted);
          font-size: 11px;
          line-height: 1.5;
        }

        .orbi-balance-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .orbi-balance-grid > div,
        .orbi-network-grid > div,
        .orbi-activity-grid > div {
          min-height: 78px;
          padding: 13px;
          border: 1px solid rgba(38, 55, 80, 0.65);
          border-radius: 12px;
          background: rgba(14, 21, 34, 0.48);
        }

        .orbi-balance-grid span,
        .orbi-network-grid span,
        .orbi-activity-grid span,
        .orbi-package-stats span,
        .orbi-achievement span,
        .orbi-achievement-wallets span,
        .orbi-package-amount span,
        .orbi-package-top span {
          display: block;
          color: var(--od-muted-2);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .orbi-balance-grid strong,
        .orbi-network-grid strong,
        .orbi-activity-grid strong {
          display: block;
          margin-top: 7px;
          font-size: 15px;
        }

        .orbi-status-text {
          color: var(--od-success) !important;
          font-size: 12px !important;
        }

        .orbi-income-list {
          display: flex;
          flex-direction: column;
        }

        .orbi-income-row {
          min-height: 45px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid rgba(38, 55, 80, 0.55);
        }

        .orbi-income-row:last-child {
          border-bottom: 0;
        }

        .orbi-income-row span {
          color: var(--od-muted);
          font-size: 12px;
        }

        .orbi-income-row strong {
          font-size: 13px;
        }

        .orbi-package-section {
          margin-bottom: 14px;
        }

        .orbi-package-summary {
          text-align: right;
        }

        .orbi-package-summary span {
          display: block;
          color: var(--od-muted-2);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .orbi-package-summary strong {
          display: block;
          margin-top: 5px;
          font-size: 18px;
        }

        .orbi-package-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }

        .orbi-package-item {
          padding: 17px;
          border: 1px solid rgba(38, 55, 80, 0.75);
          border-radius: 14px;
          background: rgba(6, 10, 17, 0.55);
        }

        .orbi-package-item.is-active {
          border-color: rgba(22, 140, 255, 0.25);
          box-shadow: inset 0 1px 0 rgba(22, 140, 255, 0.08);
        }

        .orbi-package-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .orbi-package-top strong {
          display: block;
          margin-top: 5px;
          font-size: 15px;
        }

        .orbi-package-status {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }

        .orbi-package-status.active {
          color: #86efac;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.16);
        }

        .orbi-package-status.closed {
          color: #aebbd0;
          background: rgba(139, 155, 176, 0.08);
          border: 1px solid rgba(139, 155, 176, 0.13);
        }

        .orbi-package-amount {
          margin-top: 21px;
        }

        .orbi-package-amount strong {
          display: block;
          margin-top: 4px;
          font-size: 26px;
          letter-spacing: -0.04em;
        }

        .orbi-progress-wrap {
          margin-top: 19px;
        }

        .orbi-progress-label,
        .orbi-progress-values {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .orbi-progress-label {
          color: var(--od-muted-2);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.11em;
        }

        .orbi-progress-label b {
          color: #b8d9ff;
          font-size: 9px;
          letter-spacing: 0;
        }

        .orbi-progress {
          height: 6px;
          margin-top: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: #182333;
        }

        .orbi-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--od-primary), var(--od-purple), var(--od-orange));
          box-shadow: 0 0 15px rgba(22, 140, 255, 0.35);
        }

        .orbi-progress-values {
          margin-top: 6px;
          color: var(--od-muted-2);
          font-size: 8px;
        }

        .orbi-package-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 18px;
        }

        .orbi-package-stats > div {
          padding: 9px;
          border-radius: 9px;
          background: rgba(14, 21, 34, 0.7);
        }

        .orbi-package-stats b {
          display: block;
          margin-top: 5px;
          font-size: 10px;
        }

        .orbi-emergency-status {
          margin-top: 12px;
          padding: 10px 11px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .orbi-emergency-status.eligible {
          color: #bbf7d0;
          border: 1px solid rgba(34, 197, 94, 0.18);
          background: rgba(34, 197, 94, 0.05);
        }

        .orbi-emergency-status.locked {
          color: #cbd5e1;
          border: 1px solid rgba(139, 155, 176, 0.12);
          background: rgba(139, 155, 176, 0.045);
        }

        .orbi-emergency-status span {
          display: block;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.12em;
          opacity: 0.7;
        }

        .orbi-emergency-status strong {
          display: block;
          margin-top: 3px;
          font-size: 10px;
        }

        .orbi-emergency-status small {
          color: var(--od-muted);
          font-size: 8px;
          text-align: right;
        }

        .orbi-network-grid,
        .orbi-activity-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .orbi-achievement-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .orbi-achievement {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(38, 55, 80, 0.65);
          background: linear-gradient(135deg, rgba(22, 140, 255, 0.07), rgba(115, 87, 255, 0.04));
        }

        .orbi-achievement strong {
          display: block;
          margin-top: 7px;
          font-size: 15px;
        }

        .orbi-achievement-wallets {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .orbi-achievement-wallets > div {
          padding: 11px 13px;
          border-top: 1px solid rgba(38, 55, 80, 0.5);
        }

        .orbi-achievement-wallets b {
          display: block;
          margin-top: 5px;
          font-size: 12px;
        }

        .orbi-referral-card,
        .orbi-activity-card {
          margin-bottom: 14px;
        }

        .orbi-referral-row {
          display: flex;
          gap: 10px;
        }

        .orbi-referral-input {
          flex: 1;
          min-width: 0;
          height: 45px;
          display: flex;
          align-items: center;
          padding: 0 13px;
          border: 1px solid rgba(38, 55, 80, 0.75);
          border-radius: 10px;
          background: rgba(3, 5, 8, 0.55);
          overflow: hidden;
        }

        .orbi-referral-input span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--od-muted);
          font-size: 11px;
        }

        .orbi-activity-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 14px;
          padding-top: 13px;
          border-top: 1px solid rgba(38, 55, 80, 0.55);
          color: var(--od-muted-2);
          font-size: 9px;
        }

        .orbi-package-overview-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .orbi-package-overview-grid > div {
          min-height: 108px;
          padding: 15px;
          border: 1px solid var(--od-border);
          border-radius: 14px;
          background: linear-gradient(145deg, rgba(14, 21, 34, 0.92), rgba(8, 13, 21, 0.82));
        }

        .orbi-package-overview-grid span,
        .orbi-package-detail-row span,
        .orbi-package-meta-grid span {
          display: block;
          color: var(--od-muted-2);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .orbi-package-overview-grid strong {
          display: block;
          margin-top: 9px;
          font-size: 22px;
          letter-spacing: -0.03em;
        }

        .orbi-package-overview-grid small {
          display: block;
          margin-top: 5px;
          color: var(--od-muted);
          font-size: 9px;
        }

        .orbi-package-grid-page {
          grid-template-columns: minmax(0, 1fr);
        }

        .orbi-package-page-item {
          min-width: 0;
        }

        .orbi-package-detail-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 14px;
        }

        .orbi-package-detail-row > div,
        .orbi-package-meta-grid > div {
          padding: 9px 10px;
          border-radius: 9px;
          background: rgba(14, 21, 34, 0.7);
        }

        .orbi-package-detail-row b,
        .orbi-package-meta-grid b {
          display: block;
          margin-top: 5px;
          color: #d9e6f7;
          font-size: 10px;
        }

        .orbi-package-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }

        .orbi-packages-page .orbi-no-data {
          min-height: 230px;
        }

        .orbi-no-data,
        .orbi-empty-section {
          min-height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: var(--od-muted);
          text-align: center;
        }

        .orbi-no-data {
          border: 1px dashed rgba(38, 55, 80, 0.75);
          border-radius: 13px;
        }

        .orbi-empty-section {
          min-height: 420px;
          border: 1px solid var(--od-border);
          border-radius: 18px;
          background: rgba(10, 15, 24, 0.7);
          padding: 40px;
        }

        .orbi-empty-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          color: #8fc9ff;
          background: rgba(22, 140, 255, 0.08);
          border: 1px solid rgba(22, 140, 255, 0.15);
        }

        .orbi-empty-section h2 {
          margin: 4px 0 0;
        }

        .orbi-empty-section p {
          max-width: 520px;
          margin: 0;
          color: var(--od-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 1180px) {
          .orbi-package-overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .orbi-package-grid-page {
            grid-template-columns: minmax(0, 1fr);
          }
          .orbi-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .orbi-package-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .orbi-two-column {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .orbi-sidebar {
            transform: translateX(-100%);
            transition: transform 220ms ease;
            box-shadow: 20px 0 50px rgba(0, 0, 0, 0.3);
          }

          .orbi-sidebar.open {
            transform: translateX(0);
          }

          .orbi-mobile-top {
            position: sticky;
            top: 0;
            z-index: 40;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 15px;
            margin: -1px -1px 22px;
            border-bottom: 1px solid var(--od-border);
            background: rgba(3, 5, 8, 0.86);
            backdrop-filter: blur(16px);
          }

          .orbi-mobile-brand {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.12em;
          }

          .orbi-mobile-menu {
            width: 40px;
            height: 40px;
            display: grid;
            place-items: center;
            border: 1px solid var(--od-border);
            border-radius: 10px;
            background: rgba(14, 21, 34, 0.9);
            color: #fff;
          }

          .orbi-main {
            width: 100%;
            margin-left: 0;
            padding: 0 16px 35px;
          }

          .orbi-welcome {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        .orbi-package-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .orbi-stake-btn {
          min-height: 46px;
          border: 1px solid rgba(115, 87, 255, 0.35);
          border-radius: 12px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: #fff;
          font-weight: 800;
          background: linear-gradient(135deg, #168cff, #7357ff);
          box-shadow: 0 12px 30px rgba(22, 140, 255, 0.18);
          cursor: pointer;
          transition: 180ms ease;
        }

        .orbi-stake-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 36px rgba(22, 140, 255, 0.25);
        }

        .orbi-stake-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .orbi-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.76);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .orbi-modal {
          position: relative;
          z-index: 10001;
          width: min(560px, calc(100vw - 32px));
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          margin: auto;
          padding: 24px;
          border: 1px solid var(--od-border-light);
          border-radius: 20px;
          background: linear-gradient(180deg, #0d1420 0%, #080d15 100%);
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.62), 0 0 0 1px rgba(22, 140, 255, 0.06);
        }

        .orbi-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .orbi-modal-head h2 {
          margin: 7px 0 7px;
          font-size: 26px;
          line-height: 1.1;
        }

        .orbi-modal-head p {
          margin: 0;
          color: var(--od-muted);
          font-size: 13px;
          line-height: 1.55;
          max-width: 430px;
        }

        .orbi-modal-close {
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border: 1px solid var(--od-border);
          border-radius: 10px;
          color: var(--od-muted);
          background: rgba(255,255,255,0.025);
          cursor: pointer;
        }

        .orbi-modal-close:hover:not(:disabled) {
          color: #fff;
          border-color: var(--od-border-light);
        }

        .orbi-modal-close:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .orbi-modal-balance {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 22px;
        }

        .orbi-modal-balance > div {
          padding: 14px;
          border: 1px solid var(--od-border);
          border-radius: 13px;
          background: rgba(255,255,255,0.02);
        }

        .orbi-modal-balance span,
        .orbi-modal-field label,
        .orbi-modal-label-row button {
          color: var(--od-muted-2);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .orbi-modal-balance strong {
          display: block;
          margin-top: 6px;
          color: #fff;
          font-size: 18px;
        }

        .orbi-modal-field {
          margin-top: 20px;
        }

        .orbi-modal-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .orbi-modal-label-row button {
          padding: 0;
          border: 0;
          background: transparent;
          color: #6eb8ff;
          cursor: pointer;
        }

        .orbi-modal-label-row button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .orbi-amount-input-wrap {
          display: flex;
          align-items: center;
          min-height: 60px;
          padding: 0 16px;
          gap: 10px;
          border: 1px solid #29405e;
          border-radius: 13px;
          background: #070c14;
          box-shadow: inset 0 0 0 1px rgba(22, 140, 255, 0.03);
        }

        .orbi-amount-input-wrap > span:first-child {
          color: #8fa4bd;
          font-size: 21px;
          font-weight: 700;
        }

        .orbi-amount-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          color: #fff;
          background: transparent;
          font-size: 23px;
          font-weight: 800;
        }

        .orbi-amount-input-wrap input::placeholder {
          color: #41536a;
        }

        .orbi-amount-input-wrap > span:last-child {
          flex: 0 0 auto;
          color: #6f8198;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .orbi-modal-field > small {
          display: block;
          margin-top: 8px;
          color: var(--od-muted-2);
          font-size: 11px;
        }

        .orbi-transaction-steps {
          display: grid;
          gap: 9px;
          margin-top: 20px;
        }

        .orbi-transaction-steps > div {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--od-border);
          border-radius: 12px;
          background: rgba(255,255,255,0.018);
        }

        .orbi-transaction-steps > div > span {
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #9fb1c5;
          background: #101a28;
          border: 1px solid #263a53;
          font-size: 12px;
          font-weight: 900;
        }

        .orbi-transaction-steps > div.current {
          border-color: rgba(22, 140, 255, 0.45);
          background: rgba(22, 140, 255, 0.055);
        }

        .orbi-transaction-steps > div.current > span {
          color: #fff;
          border-color: rgba(22, 140, 255, 0.6);
          background: rgba(22, 140, 255, 0.2);
        }

        .orbi-transaction-steps > div.done > span {
          color: #fff;
          border-color: rgba(34, 197, 94, 0.45);
          background: rgba(34, 197, 94, 0.14);
        }

        .orbi-transaction-steps strong {
          display: block;
          color: #eef4fb;
          font-size: 13px;
        }

        .orbi-transaction-steps small {
          display: block;
          margin-top: 3px;
          color: var(--od-muted-2);
          font-size: 11px;
          line-height: 1.4;
        }

        .orbi-modal-message {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 14px;
          padding: 11px 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #ffb4b4;
          background: rgba(239, 68, 68, 0.06);
          font-size: 12px;
          line-height: 1.45;
          word-break: break-word;
        }

        .orbi-modal-tx {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 11px;
          color: #72bcff;
          font-size: 11px;
          text-decoration: none;
        }

        .orbi-modal-submit {
          width: 100%;
          min-height: 52px;
          margin-top: 18px;
          border: 0;
          border-radius: 12px;
          color: #fff;
          background: linear-gradient(135deg, #168cff, #7357ff);
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 14px 34px rgba(22, 140, 255, 0.2);
        }

        .orbi-modal-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .orbi-modal-note {
          margin: 12px 0 0;
          color: var(--od-muted-2);
          text-align: center;
          font-size: 10px;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .orbi-package-overview-grid,
          .orbi-package-grid-page,
          .orbi-package-detail-row,
          .orbi-package-meta-grid {
            grid-template-columns: 1fr;
          }

          .orbi-stat-grid,
          .orbi-package-grid,
          .orbi-balance-grid,
          .orbi-network-grid,
          .orbi-activity-grid,
          .orbi-achievement-row,
          .orbi-achievement-wallets {
            grid-template-columns: 1fr;
          }

          .orbi-connect-panel {
            flex-direction: column;
            align-items: flex-start;
          }

          .orbi-primary-btn {
            width: 100%;
          }

          .orbi-package-actions {
            width: 100%;
            justify-content: stretch;
          }

          .orbi-package-actions > button {
            flex: 1 1 100%;
            width: 100%;
          }

          .orbi-modal-backdrop {
            align-items: flex-end;
            padding: 10px;
          }

          .orbi-modal {
            width: 100%;
            max-height: calc(100vh - 20px);
            padding: 18px;
            border-radius: 18px;
          }

          .orbi-modal-balance {
            grid-template-columns: 1fr;
          }

          .orbi-wallet-bar,
          .orbi-activity-foot {
            align-items: flex-start;
            flex-direction: column;
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .orbi-package-stats {
            grid-template-columns: 1fr 1fr;
          }

          .orbi-referral-row {
            flex-direction: column;
          }

          .orbi-copy-btn {
            width: 100%;
          }

          .orbi-card {
            padding: 16px;
          }
        }
      `}</style>

      <aside className={`orbi-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="orbi-brand">
          <div className="orbi-brand-mark">OW</div>
          <div>
            <div className="orbi-brand-name">ORBI WORLD</div>
            <div className="orbi-brand-sub">DECENTRALIZED ECOSYSTEM</div>
          </div>
        </div>

        <nav className="orbi-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`orbi-nav-button ${
                activeNav === item.label ? "active" : ""
              } ${item.danger ? "danger" : ""}`}
              onClick={() => {
                setActiveNav(item.label);
                setMobileOpen(false);
              }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}

          <div className="orbi-nav-divider" />

          {utilityItems.map((item) => (
            <button
              key={item.label}
              className={`orbi-nav-button ${
                activeNav === item.label ? "active" : ""
              }`}
              onClick={() => {
                setActiveNav(item.label);
                setMobileOpen(false);
              }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="orbi-sidebar-bottom">
          ORBI WORLD<br />
          BNB SMART CHAIN TESTNET
        </div>
      </aside>

      <section className="orbi-main">
        <div className="orbi-mobile-top">
          <span className="orbi-mobile-brand">ORBI WORLD</span>
          <button
            className="orbi-mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={20} />
          </button>
        </div>

        <div className="orbi-main-inner">{renderMain()}</div>
      </section>

      {stakeModalOpen && (
        <div
          className="orbi-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeStakeModal();
          }}
        >
          <div
            className="orbi-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="orbi-stake-modal-title"
          >
            <div className="orbi-modal-head">
              <div>
                <span className="orbi-section-kicker">ON-CHAIN STAKING</span>
                <h2 id="orbi-stake-modal-title">
                  {user.status === BigInt(USER_STATUS.ACTIVE)
                    ? "Top Up Package"
                    : "Account Activation"}
                </h2>
                <p>
                  {user.status === BigInt(USER_STATUS.ACTIVE)
                    ? "Add MOCUSDT to create another package on-chain."
                    : "Activate your ORBI WORLD account with your first package."}
                </p>
              </div>
              <button
                className="orbi-modal-close"
                onClick={closeStakeModal}
                disabled={stakeBusy}
                aria-label="Close staking modal"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="orbi-modal-balance">
              <div>
                <span>MOCUSDT AVAILABLE</span>
                <strong>${formatUsdt(usdtBalance)}</strong>
              </div>
              <div>
                <span>MINIMUM</span>
                <strong>${formatUsdt(minimumStake)}</strong>
              </div>
            </div>

            <div className="orbi-modal-field">
              <div className="orbi-modal-label-row">
                <label htmlFor="orbi-stake-amount">AMOUNT</label>
                <button
                  type="button"
                  onClick={() => setStakeAmount(ethers.formatUnits(usdtBalance, 18))}
                  disabled={stakeBusy || usdtBalance <= 0n}
                >
                  MAX
                </button>
              </div>
              <div className="orbi-amount-input-wrap">
                <span>$</span>
                <input
                  id="orbi-stake-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*(?:\.\d{0,18})?$/.test(value)) {
                      setStakeAmount(value);
                      setStakeMessage("");
                    }
                  }}
                  disabled={stakeBusy}
                />
                <span>MOCUSDT</span>
              </div>
              <small>
                Available: ${formatUsdt(usdtBalance)} · Minimum: ${formatUsdt(minimumStake)}
              </small>
            </div>

            <div className="orbi-transaction-steps">
              <div className={stakeStep === "approving" ? "current" : stakeStep === "staking" ? "done" : ""}>
                <span>1</span>
                <div>
                  <strong>MOCUSDT Approval</strong>
                  <small>Allow ORBI WORLD to use the selected amount.</small>
                </div>
              </div>
              <div className={stakeStep === "staking" ? "current" : ""}>
                <span>2</span>
                <div>
                  <strong>
                    {user.status === BigInt(USER_STATUS.ACTIVE)
                      ? "Create Top-Up Package"
                      : "Activate Account"}
                  </strong>
                  <small>Confirm the ORBI WORLD transaction in your wallet.</small>
                </div>
              </div>
            </div>

            {stakeMessage && (
              <div className="orbi-modal-message">
                <Icon name="alert" size={16} />
                <span>{stakeMessage}</span>
              </div>
            )}

            {stakeTxHash && (
              <a
                className="orbi-modal-tx"
                href={`${BLOCK_EXPLORER}/tx/${stakeTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View transaction on BscScan <Icon name="external" size={13} />
              </a>
            )}

            <button
              className="orbi-modal-submit"
              onClick={submitStake}
              disabled={stakeBusy || !stakeAmount || usdtBalance <= 0n}
            >
              {stakeBusy
                ? stakeStep === "approving"
                  ? "Waiting for Approval..."
                  : "Waiting for Confirmation..."
                : user.status === BigInt(USER_STATUS.ACTIVE)
                  ? "Approve & Top Up"
                  : "Approve & Stake"}
            </button>

            <p className="orbi-modal-note">
              You will be asked to confirm each blockchain transaction in your connected wallet.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  meta,
}: {
  icon: string;
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="orbi-stat">
      <div className="orbi-stat-icon">
        <Icon name={icon} size={18} />
      </div>
      <div className="orbi-stat-label">{label}</div>
      <div className="orbi-stat-value">{value}</div>
      <div className="orbi-stat-meta">{meta}</div>
    </div>
  );
}

function IncomeRow({
  label,
  value,
}: {
  label: string;
  value: bigint;
}) {
  return (
    <div className="orbi-income-row">
      <span>{label}</span>
      <strong>${formatUsdt(value)}</strong>
    </div>
  );
}
