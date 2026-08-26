"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ethers } from "ethers";

import {
  CONTRACT_ADDRESS,
  BSC_TESTNET,
  WalletType,
  getContract,
  getUSDTContract,
  parseUSDT,
  formatUSDT,
  shortAddress,
  ensureBscTestnet,
} from "../../lib/contract";

/* =========================================================
   TYPES
========================================================= */

type Section =
  | "overview"
  | "packages"
  | "earnings"
  | "business"
  | "referral"
  | "level-income"
  | "rank"
  | "royalty"
  | "withdrawal"
  | "emergency"
  | "history-staking"
  | "history-withdrawal"
  | "history-rank"
  | "history-royalty"
  | "profile";

type Profile = {
  id: ethers.BigNumber;
  wallet: string;
  sponsorId: ethers.BigNumber;

  status: number;

  directCount: number;
  activeDirectCount: number;

  lifetimeBusiness: ethers.BigNumber;
  monthlyBusiness: ethers.BigNumber;
  todayBusiness: ethers.BigNumber;

  powerLegBusiness: ethers.BigNumber;
  otherLegBusiness: ethers.BigNumber;

  earningWallet: ethers.BigNumber;
  rankWallet: ethers.BigNumber;
  royaltyWallet: ethers.BigNumber;

  totalROIIncome: ethers.BigNumber;
  totalLevelIncome: ethers.BigNumber;
  totalRankIncome: ethers.BigNumber;
  totalRoyaltyIncome: ethers.BigNumber;

  totalWithdrawn: ethers.BigNumber;

  rank: number;
  royalty: number;
};

type Config = {
  minStake: ethers.BigNumber;
  minTopup: ethers.BigNumber;
  minWithdrawal: ethers.BigNumber;

  feeBps: number;
  roiBps: number;

  registrationEnabled: boolean;
  stakingEnabled: boolean;
  withdrawalEnabled: boolean;
  capitalWithdrawalEnabled: boolean;

  levelEnabled: boolean;
  rankEnabled: boolean;
  royaltyEnabled: boolean;
};

type PackageRow = {
  packageId: string;
  amount: ethers.BigNumber;
  block: number;
  tx: string;
  startTime: number;
  roiPaid: ethers.BigNumber;
  closed: boolean;
  closeStatus?: number;
};

type WithdrawalRow = {
  requestId: string;
  walletType: number;

  amount: ethers.BigNumber;
  fee: ethers.BigNumber;
  netAmount: ethers.BigNumber;

  block: number;
  tx: string;

  status: "PENDING" | "APPROVED" | "REJECTED";
};

type RankRow = {
  rank: number;
  reward: ethers.BigNumber;
  block: number;
  tx: string;
};

type RoyaltyRow = {
  level: number;
  amount: ethers.BigNumber;
  block: number;
  tx: string;
};

type TeamRow = {
  id: string;
  wallet: string;
  sponsorId: string;
  status: number;
  directCount: number;
  activeDirectCount: number;
};

/* =========================================================
   CONSTANTS
========================================================= */

const ZERO = ethers.constants.Zero;

const MAX_MULTIPLIER = 2;

/*
 * AccessControl DEFAULT_ADMIN_ROLE = bytes32(0)
 */
const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;

/*
 * Small ABI only for checking admin role.
 * No need to modify contract.ts.
 */
const ACCESS_CONTROL_ABI = [
  "function hasRole(bytes32 role,address account) view returns (bool)",
];

const RANKS = [
  {
    name: "R1",
    power: 1500,
    other: 1500,
    reward: 150,
  },
  {
    name: "R2",
    power: 5000,
    other: 5000,
    reward: 300,
  },
  {
    name: "R3",
    power: 10000,
    other: 10000,
    reward: 500,
  },
  {
    name: "R4",
    power: 20000,
    other: 20000,
    reward: 1000,
  },
  {
    name: "R5",
    power: 50000,
    other: 50000,
    reward: 3000,
  },
  {
    name: "R6",
    power: 100000,
    other: 100000,
    reward: 5000,
  },
];

const ROYALTIES = [
  {
    name: "1%",
    lifetime: 25000,
    monthly: 5000,
    directs: 2,
  },
  {
    name: "2%",
    lifetime: 50000,
    monthly: 10000,
    directs: 3,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function bn(value: any): ethers.BigNumber {
  try {
    return ethers.BigNumber.from(value ?? 0);
  } catch {
    return ZERO;
  }
}

function units(value: string) {
  return parseUSDT(value || "0");
}

function money(value: any) {
  const number = Number(formatUSDT(bn(value)));

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function errorText(error: any, fallback: string) {
  return (
    error?.error?.message ||
    error?.data?.message ||
    error?.reason ||
    error?.message ||
    fallback
  );
}

function statusLabel(status: number) {
  return (
    [
      "NONE",
      "INACTIVE",
      "ACTIVE",
      "EMERGENCY EXIT",
      "BLACKLISTED",
    ][status] || "UNKNOWN"
  );
}

function rankLabel(rank: number) {
  return rank === 0 ? "NONE" : `R${rank}`;
}

function royaltyLabel(level: number) {
  if (level === 1) return "1%";
  if (level === 2) return "2%";
  return "NONE";
}

function walletLabel(walletType: number) {
  if (walletType === WalletType.EARNING) {
    return "Earning";
  }

  if (walletType === WalletType.RANK) {
    return "Rank";
  }

  return "Royalty";
}

function txUrl(hash: string) {
  return `${BSC_TESTNET.explorer}/tx/${hash}`;
}

function addressUrl(address: string) {
  return `${BSC_TESTNET.explorer}/address/${address}`;
}

/* =========================================================
   NAVIGATION
========================================================= */

const MAIN_NAV: {
  id: Section;
  label: string;
  icon: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "⌂",
  },
  {
    id: "packages",
    label: "My Packages",
    icon: "▣",
  },
  {
    id: "earnings",
    label: "Earnings",
    icon: "◈",
  },
  {
    id: "business",
    label: "Business Center",
    icon: "♧",
  },
  {
    id: "referral",
    label: "Referral Center",
    icon: "↗",
  },
   {
    id: "level-income",
    label: "Level Income",
    icon: "◉",
  },
  {
    id: "rank",
    label: "Rank Center",
    icon: "★",
  },
  {
    id: "royalty",
    label: "Royalty Center",
    icon: "♛",
  },
  {
    id: "withdrawal",
    label: "Withdrawal",
    icon: "⇧",
  },
  {
    id: "emergency",
    label: "Emergency Capital Withdrawal",
    icon: "⚠",
  },
];

const HISTORY_NAV: {
  id: Section;
  label: string;
}[] = [
  {
    id: "history-staking",
    label: "Staking History",
  },
  {
    id: "history-withdrawal",
    label: "Withdrawal History",
  },
  {
    id: "history-rank",
    label: "Rank Reward History",
  },
  {
    id: "history-royalty",
    label: "Royalty History",
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function DashboardPage() {
  const [account, setAccount] = useState("");

  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);

  const [signer, setSigner] =
    useState<ethers.Signer | null>(null);

  const [contract, setContract] =
    useState<ethers.Contract | null>(null);

  const [token, setToken] =
    useState<ethers.Contract | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [config, setConfig] = useState<Config>({
    minStake: parseUSDT("50"),
    minTopup: parseUSDT("50"),
    minWithdrawal: parseUSDT("20"),

    feeBps: 1000,
    roiBps: 50,

    registrationEnabled: true,
    stakingEnabled: true,
    withdrawalEnabled: true,
    capitalWithdrawalEnabled: true,

    levelEnabled: true,
    rankEnabled: true,
    royaltyEnabled: true,
  });

  const [usdtBalance, setUsdtBalance] =
    useState<ethers.BigNumber>(ZERO);

  const [section, setSection] =
    useState<Section>("overview");

  const [packages, setPackages] =
    useState<PackageRow[]>([]);

  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRow[]>([]);

  const [rankHistory, setRankHistory] =
    useState<RankRow[]>([]);

  const [royaltyHistory, setRoyaltyHistory] =
    useState<RoyaltyRow[]>([]);

  const [team, setTeam] =
    useState<TeamRow[]>([]);

  const [stakeAmount, setStakeAmount] =
    useState("");

  const [withdrawAmount, setWithdrawAmount] =
    useState("");

  const [withdrawWallet, setWithdrawWallet] =
    useState<WalletType>(WalletType.EARNING);

  const [busy, setBusy] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [historyOpen, setHistoryOpen] =
    useState(true);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  /* =======================================================
     REFERRAL LINK
  ======================================================= */

  const referralLink = useMemo(() => {
    if (!account || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/dashboard?ref=${account}`;
  }, [account]);

  /* =======================================================
     TOTAL AVAILABLE
  ======================================================= */

  const totalAvailable = useMemo(() => {
    if (!profile) {
      return ZERO;
    }

    return profile.earningWallet
      .add(profile.rankWallet)
      .add(profile.royaltyWallet);
  }, [profile]);

  /* =======================================================
     NOTIFICATION
  ======================================================= */

  const notify = useCallback((text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 5000);
  }, []);

  /* =======================================================
     CLEAR STATE
  ======================================================= */

  const clearState = useCallback(() => {
    setAccount("");

    setProvider(null);
    setSigner(null);
    setContract(null);
    setToken(null);

    setProfile(null);

    setPackages([]);
    setWithdrawals([]);
    setRankHistory([]);
    setRoyaltyHistory([]);
    setTeam([]);

    setUsdtBalance(ZERO);
  }, []);

  /* =======================================================
     LOAD CONFIG
  ======================================================= */

  const loadConfig = useCallback(
    async (c: ethers.Contract) => {
      try {
        const [
          staking,
          withdrawal,
          roi,
          features,
          level,
          rank,
          royalty,
        ] = await Promise.all([
          c.s_stakingConfig(),
          c.s_withdrawalConfig(),
          c.s_roiConfig(),
          c.s_featureConfig(),
          c.s_levelConfig(),
          c.s_rankConfig(),
          c.s_royaltyConfig(),
        ]);

        setConfig({
          minStake: bn(
            staking.minimumStake ?? staking[0]
          ),

          minTopup: bn(
            staking.minimumTopup ?? staking[1]
          ),

          minWithdrawal: bn(
            withdrawal.minimumWithdrawal ??
              withdrawal[0]
          ),

          feeBps: Number(
            withdrawal.withdrawalFeeBps ??
              withdrawal[1]
          ),

          roiBps: Number(
            roi.dailyROIBps ?? roi[0]
          ),

          registrationEnabled: Boolean(
            features.registrationEnabled ??
              features[0]
          ),

          stakingEnabled: Boolean(
            features.stakingEnabled ??
              features[1]
          ),

          withdrawalEnabled: Boolean(
            features.withdrawalEnabled ??
              features[2]
          ),

          capitalWithdrawalEnabled: Boolean(
            features.capitalWithdrawalEnabled ??
              features[3]
          ),

          levelEnabled: Boolean(
            level.levelIncomeEnabled ??
              level[0]
          ),

          rankEnabled: Boolean(
            rank.rankRewardEnabled ??
              rank[0]
          ),

          royaltyEnabled: Boolean(
            royalty.royaltyEnabled ??
              royalty[0]
          ),
        });
      } catch (e) {
        console.warn(
          "Config loading failed:",
          e
        );
      }
    },
    []
  );

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile = useCallback(
    async (
      c: ethers.Contract,
      address: string
    ) => {
      const registered =
        await c.isRegistered(address);

      if (!registered) {
        setProfile(null);
        return false;
      }

      const raw =
        await c.myProfile();

      const parsed: Profile = {
        id: bn(raw.id ?? raw[0]),

        wallet:
          raw.wallet ?? raw[1],

        sponsorId:
          bn(raw.sponsorId ?? raw[2]),

        status:
          Number(raw.status ?? raw[3] ?? 0),

        directCount:
          Number(raw.directCount ?? raw[4] ?? 0),

        activeDirectCount:
          Number(
            raw.activeDirectCount ??
              raw[5] ??
              0
          ),

        lifetimeBusiness:
          bn(
            raw.lifetimeBusiness ??
              raw[6]
          ),

        monthlyBusiness:
          bn(
            raw.monthlyBusiness ??
              raw[7]
          ),

        todayBusiness:
          bn(
            raw.todayBusiness ??
              raw[8]
          ),

        powerLegBusiness:
          bn(
            raw.powerLegBusiness ??
              raw[9]
          ),

        otherLegBusiness:
          bn(
            raw.otherLegBusiness ??
              raw[10]
          ),

        earningWallet:
          bn(
            raw.earningWallet ??
              raw[11]
          ),

        rankWallet:
          bn(
            raw.rankWallet ??
              raw[12]
          ),

        royaltyWallet:
          bn(
            raw.royaltyWallet ??
              raw[13]
          ),

        totalROIIncome:
          bn(
            raw.totalROIIncome ??
              raw[14]
          ),

        totalLevelIncome:
          bn(
            raw.totalLevelIncome ??
              raw[15]
          ),

        totalRankIncome:
          bn(
            raw.totalRankIncome ??
              raw[16]
          ),

        totalRoyaltyIncome:
          bn(
            raw.totalRoyaltyIncome ??
              raw[17]
          ),

        totalWithdrawn:
          bn(
            raw.totalWithdrawn ??
              raw[18]
          ),

        rank:
          Number(
            raw.rank ??
              raw[19] ??
              0
          ),

        royalty:
          Number(
            raw.royalty ??
              raw[20] ??
              0
          ),
      };

      setProfile(parsed);

      return true;
    },
    []
  );

  /* =======================================================
     LOAD PACKAGES — DIRECT ON-CHAIN READ

     Package history/state comes from contract storage only:
     getUserPackages(userId)
     getActiveUserPackages(userId)
     getPackage(packageId)

     No PackageActivated / PackageTopup / PackageClosed scans.
  ======================================================= */

  const loadPackages = useCallback(
    async (c: ethers.Contract, userId: ethers.BigNumber) => {
      const [packageIdsRaw, activePackageIdsRaw] =
        await Promise.all([
          c.getUserPackages(userId),
          c.getActiveUserPackages(userId),
        ]);

      const packageIds = (packageIdsRaw as any[]).map((id) =>
        bn(id).toString()
      );

      const activePackageIds = new Set(
        (activePackageIdsRaw as any[]).map((id) =>
          bn(id).toString()
        )
      );

      const packageRows: PackageRow[] = await Promise.all(
        packageIds.map(async (packageId) => {
          const pkg = await c.getPackage(packageId);

          const id = bn(pkg.id ?? pkg[0]).toString();
          const amount = bn(pkg.amount ?? pkg[2]);
          const roiPaid = bn(pkg.roiPaid ?? pkg[4]);
          const startTime = Number(pkg.startTime ?? pkg[7] ?? 0);
          const status = Number(pkg.status ?? pkg[11] ?? 0);
          const exists = Boolean(pkg.exists ?? pkg[14]);
          const isActive = activePackageIds.has(id);

          return {
            packageId: id,
            amount,
            block: 0,
            tx: '',
            startTime,
            roiPaid,
            closed: !isActive || status !== 0 || !exists,
          };
        })
      );

      packageRows.sort(
        (a, b) => Number(b.packageId) - Number(a.packageId)
      );

      setPackages(packageRows);
    },
    []
  );

  /* =======================================================
     LOAD NON-PACKAGE HISTORY

     Withdrawal / rank / royalty / team history still use events.
     Package events are intentionally excluded.
  ======================================================= */

  const loadHistory = useCallback(
    async (c: ethers.Contract, p: Profile) => {
      try {
        const latest = await c.provider.getBlockNumber();
        const historyFromBlock = Math.max(0, latest - 50000);
        const chunkSize = 2000;

        const safeQuery = async (filter: any) => {
          const results: any[] = [];

          for (let from = historyFromBlock; from <= latest; from += chunkSize) {
            const to = Math.min(from + chunkSize - 1, latest);

            try {
              const chunk = await c.queryFilter(filter, from, to);
              results.push(...chunk);
            } catch (queryError) {
              console.warn(
                `History query failed for blocks ${from}-${to}:`,
                queryError
              );
            }
          }

          return results;
        };

        const [
          requested,
          approved,
          rejected,
          rankEvents,
          royaltyEvents,
          registered,
        ] = await Promise.all([
          safeQuery(
            c.filters.WithdrawalRequested(
              null,
              p.id,
              null,
              null,
              null,
              null
            )
          ),
          safeQuery(
            c.filters.WithdrawalApproved(
              null,
              p.id,
              null
            )
          ),
          safeQuery(
            c.filters.WithdrawRejected(
              null,
              p.id
            )
          ),
          safeQuery(
            c.filters.RankRewardPaid(
              p.id,
              null,
              null
            )
          ),
          safeQuery(
            c.filters.RoyaltyDistributed(
              p.id,
              null,
              null
            )
          ),
          safeQuery(
            c.filters.UserRegistered(
              null,
              null,
              p.id
            )
          ),
        ]);

        const withdrawalMap = new Map<string, WithdrawalRow>();

        for (const event of requested as any[]) {
          const args = event.args;
          const id = bn(args.requestId ?? args[0]).toString();

          withdrawalMap.set(id, {
            requestId: id,
            walletType: Number(args.walletType ?? args[2]),
            amount: bn(args.amount ?? args[3]),
            fee: bn(args.fee ?? args[4]),
            netAmount: bn(args.netAmount ?? args[5]),
            block: event.blockNumber,
            tx: event.transactionHash,
            status: 'PENDING',
          });
        }

        for (const event of approved as any[]) {
          const id = bn(event.args.requestId ?? event.args[0]).toString();
          const row = withdrawalMap.get(id);
          if (row) row.status = 'APPROVED';
        }

        for (const event of rejected as any[]) {
          const id = bn(event.args.requestId ?? event.args[0]).toString();
          const row = withdrawalMap.get(id);
          if (row) row.status = 'REJECTED';
        }

        setWithdrawals(
          Array.from(withdrawalMap.values()).sort(
            (a, b) => b.block - a.block
          )
        );

        setRankHistory(
          (rankEvents as any[])
            .map((event) => ({
              rank: Number(event.args.rank ?? event.args[1]),
              reward: bn(event.args.reward ?? event.args[2]),
              block: event.blockNumber,
              tx: event.transactionHash,
            }))
            .reverse()
        );

        setRoyaltyHistory(
          (royaltyEvents as any[])
            .map((event) => ({
              level: Number(
                event.args.royaltyLevel ?? event.args[1]
              ),
              amount: bn(event.args.amount ?? event.args[2]),
              block: event.blockNumber,
              tx: event.transactionHash,
            }))
            .reverse()
        );

        const teamRows: TeamRow[] = [];

        for (const event of registered as any[]) {
          const args = event.args;
          const id = bn(args.userId ?? args[0]);
          const wallet = String(args.wallet ?? args[1]);

          try {
            const rawUser = await c.getUser(id);

            teamRows.push({
              id: id.toString(),
              wallet,
              sponsorId: bn(rawUser.sponsorId ?? rawUser[2]).toString(),
              status: Number(rawUser.status ?? rawUser[3] ?? 0),
              directCount: Number(
                rawUser.directCount ?? rawUser[4] ?? 0
              ),
              activeDirectCount: Number(
                rawUser.activeDirectCount ?? rawUser[5] ?? 0
              ),
            });
          } catch {
            // Ignore an individual team read failure.
          }
        }

        setTeam(teamRows.reverse());
      } catch (e) {
        console.warn('History loading failed:', e);
      }
    },
    []
  );

  /* =======================================================
     REFRESH DASHBOARD
  ======================================================= */

  const refresh =
    useCallback(async () => {
      if (!contract || !account) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        await loadConfig(
          contract
        );

        const registered =
          await loadProfile(
            contract,
            account
          );

        const balance =
          token
            ? await token.balanceOf(
                account
              )
            : ZERO;

        setUsdtBalance(
          bn(balance)
        );

        if (!registered) {
          setPackages([]);
          setWithdrawals([]);
          setRankHistory([]);
          setRoyaltyHistory([]);
          setTeam([]);

          return;
        }

        const raw =
          await contract.myProfile();

        const currentProfile: Profile =
          {
            id: bn(
              raw.id ??
                raw[0]
            ),

            wallet:
              raw.wallet ??
              raw[1],

            sponsorId:
              bn(
                raw.sponsorId ??
                  raw[2]
              ),

            status:
              Number(
                raw.status ??
                  raw[3] ??
                  0
              ),

            directCount:
              Number(
                raw.directCount ??
                  raw[4] ??
                  0
              ),

            activeDirectCount:
              Number(
                raw.activeDirectCount ??
                  raw[5] ??
                  0
              ),

            lifetimeBusiness:
              bn(
                raw.lifetimeBusiness ??
                  raw[6]
              ),

            monthlyBusiness:
              bn(
                raw.monthlyBusiness ??
                  raw[7]
              ),

            todayBusiness:
              bn(
                raw.todayBusiness ??
                  raw[8]
              ),

            powerLegBusiness:
              bn(
                raw.powerLegBusiness ??
                  raw[9]
              ),

            otherLegBusiness:
              bn(
                raw.otherLegBusiness ??
                  raw[10]
              ),

            earningWallet:
              bn(
                raw.earningWallet ??
                  raw[11]
              ),

            rankWallet:
              bn(
                raw.rankWallet ??
                  raw[12]
              ),

            royaltyWallet:
              bn(
                raw.royaltyWallet ??
                  raw[13]
              ),

            totalROIIncome:
              bn(
                raw.totalROIIncome ??
                  raw[14]
              ),

            totalLevelIncome:
              bn(
                raw.totalLevelIncome ??
                  raw[15]
              ),

            totalRankIncome:
              bn(
                raw.totalRankIncome ??
                  raw[16]
              ),

            totalRoyaltyIncome:
              bn(
                raw.totalRoyaltyIncome ??
                  raw[17]
              ),

            totalWithdrawn:
              bn(
                raw.totalWithdrawn ??
                  raw[18]
              ),

            rank:
              Number(
                raw.rank ??
                  raw[19] ??
                  0
              ),

            royalty:
              Number(
                raw.royalty ??
                  raw[20] ??
                  0
              ),
          };

        await Promise.all([
          loadPackages(contract, currentProfile.id),
          loadHistory(contract, currentProfile),
        ]);
      } catch (e: any) {
        setError(
          errorText(
            e,
            "Dashboard refresh failed."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      contract,
      account,
      token,
      loadConfig,
      loadProfile,
      loadPackages,
      loadHistory,
    ]);

  /* =======================================================
     CONNECT WALLET
  ======================================================= */

  const connectWallet =
    useCallback(async () => {
      if (!window.ethereum) {
        setError(
          "Please install MetaMask."
        );

        return;
      }

      setConnecting(true);
      setError("");

      try {
        await ensureBscTestnet();

        await window.ethereum.request({
          method:
            "eth_requestAccounts",
        });

        const web3Provider =
          new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
          );

        const web3Signer =
          web3Provider.getSigner();

        const address =
          await web3Signer.getAddress();

        const orbiContract =
          getContract(
            web3Signer
          );

        const usdtContract =
          getUSDTContract(
            web3Provider
          );

        setProvider(
          web3Provider
        );

        setSigner(
          web3Signer
        );

        setContract(
          orbiContract
        );

        setToken(
          usdtContract
        );

        setAccount(
          address
        );

        await loadConfig(
          orbiContract
        );

        /*
         * Check registration.
         */
        let registered =
          await orbiContract.isRegistered(
            address
          );

        /*
         * =================================================
         * ROOT / OWNER AUTO REGISTRATION
         *
         * Contract constructor grants DEFAULT_ADMIN_ROLE
         * to deployer but does NOT create a User.
         *
         * First admin wallet is therefore registered here
         * as root with sponsor = zero address.
         * =================================================
         */

        if (!registered) {
          const accessControl =
            new ethers.Contract(
              CONTRACT_ADDRESS,
              ACCESS_CONTROL_ABI,
              web3Provider
            );

          const isAdmin =
            await accessControl.hasRole(
              DEFAULT_ADMIN_ROLE,
              address
            );

          const stats =
            await orbiContract.s_systemStats();

          const totalUsers =
            bn(
              stats.totalUsers ??
                stats[0]
            );

          const params =
            new URLSearchParams(
              window.location.search
            );

          const referral =
            params.get("ref");

          /*
           * OWNER / ROOT
           */
          if (
            isAdmin &&
            totalUsers.isZero()
          ) {
            notify(
              "Initializing ORBI root account..."
            );

            const tx =
              await orbiContract
                .connect(
                  web3Signer
                )
                .registerOnly(
                  ethers.constants
                    .AddressZero
                );

            await tx.wait();

            registered = true;

            notify(
              "Root account registered successfully."
            );
          }

          /*
           * NORMAL USER WITH REFERRAL LINK
           */
          else if (
            referral &&
            ethers.utils.isAddress(
              referral
            )
          ) {
            notify(
              "Referral detected. Confirm registration in MetaMask..."
            );

            const tx =
              await orbiContract
                .connect(
                  web3Signer
                )
                .registerOnly(
                  referral
                );

            await tx.wait();

            registered = true;

            notify(
              "Registration successful. Welcome to ORBIWORLD."
            );
          }
        }

        /*
         * If no referral exists, DO NOT show
         * old Account Registration form.
         */
        if (!registered) {
          notify(
            "Wallet connected. Open a valid ORBI referral link to register."
          );
        }
      } catch (e: any) {
        console.error(e);

        setError(
          errorText(
            e,
            "Wallet connection failed."
          )
        );
      } finally {
        setConnecting(false);
      }
    }, [
      loadConfig,
      notify,
    ]);

  /* =======================================================
     WALLET EVENTS
  ======================================================= */

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const onAccountsChanged =
      (
        accounts: string[]
      ) => {
        if (
          !accounts.length
        ) {
          clearState();
        } else {
          connectWallet().catch(
            () => {}
          );
        }
      };

    const onChainChanged =
      () => {
        window.location.reload();
      };

    window.ethereum.on?.(
      "accountsChanged",
      onAccountsChanged
    );

    window.ethereum.on?.(
      "chainChanged",
      onChainChanged
    );

    return () => {
      window.ethereum.removeListener?.(
        "accountsChanged",
        onAccountsChanged
      );

      window.ethereum.removeListener?.(
        "chainChanged",
        onChainChanged
      );
    };
  }, [
    connectWallet,
    clearState,
  ]);

  /* =======================================================
     REFRESH AFTER CONNECT
  ======================================================= */

  useEffect(() => {
    if (
      account &&
      contract
    ) {
      refresh();
    }
  }, [
    account,
    contract,
    refresh,
  ]);

  /* =======================================================
     DISCONNECT
  ======================================================= */

  function disconnectWallet() {
    clearState();
    setSection("overview");
  }

  /* =======================================================
     APPROVE USDT
  ======================================================= */

  async function approveIfNeeded(
    amount: ethers.BigNumber
  ) {
    if (
      !token ||
      !signer ||
      !account
    ) {
      throw new Error(
        "Wallet not connected."
      );
    }

    const allowance =
      bn(
        await token.allowance(
          account,
          CONTRACT_ADDRESS
        )
      );

    if (
      allowance.gte(amount)
    ) {
      return;
    }

    const tx =
      await token
        .connect(signer)
        .approve(
          CONTRACT_ADDRESS,
          amount
        );

    notify(
      "USDT approval submitted..."
    );

    await tx.wait();
  }

  /* =======================================================
     ACTIVATE PACKAGE
  ======================================================= */

  async function activatePackage() {
    if (
      !contract ||
      !token ||
      !signer
    ) {
      return;
    }

    try {
      const amount =
        units(
          stakeAmount
        );

      if (
        amount.lt(
          config.minStake
        )
      ) {
        throw new Error(
          `Minimum stake is ${money(
            config.minStake
          )} USDT.`
        );
      }

      setBusy(true);

      await approveIfNeeded(
        amount
      );

      const tx =
        await contract
          .connect(signer)
          .activateAccount(
            amount
          );

      notify(
        "Package activation submitted..."
      );

      await tx.wait();

      setStakeAmount("");

      notify(
        "Package activated successfully."
      );

      await refresh();
    } catch (e: any) {
      setError(
        errorText(
          e,
          "Activation failed."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     TOP UP
  ======================================================= */

  async function topUpPackage() {
    if (
      !contract ||
      !token ||
      !signer
    ) {
      return;
    }

    try {
      const amount =
        units(
          stakeAmount
        );

      if (
        amount.lt(
          config.minTopup
        )
      ) {
        throw new Error(
          `Minimum top-up is ${money(
            config.minTopup
          )} USDT.`
        );
      }

      setBusy(true);

      await approveIfNeeded(
        amount
      );

      const tx =
        await contract
          .connect(signer)
          .topUp(
            amount
          );

      notify(
        "Top-up submitted..."
      );

      await tx.wait();

      setStakeAmount("");

      notify(
        "Top-up successful."
      );

      await refresh();
    } catch (e: any) {
      setError(
        errorText(
          e,
          "Top-up failed."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     WITHDRAWAL
  ======================================================= */

  async function requestWithdrawal() {
    if (
      !contract ||
      !signer ||
      !profile
    ) {
      return;
    }

    try {
      const amount =
        units(
          withdrawAmount
        );

      if (
        amount.lt(
          config.minWithdrawal
        )
      ) {
        throw new Error(
          `Minimum withdrawal is ${money(
            config.minWithdrawal
          )} USDT.`
        );
      }

      const available =
        withdrawWallet ===
        WalletType.EARNING
          ? profile.earningWallet
          : withdrawWallet ===
            WalletType.RANK
          ? profile.rankWallet
          : profile.royaltyWallet;

      if (
        amount.gt(
          available
        )
      ) {
        throw new Error(
          "Insufficient selected wallet balance."
        );
      }

      setBusy(true);

      const tx =
        await contract
          .connect(signer)
          .requestWithdraw(
            withdrawWallet,
            amount
          );

      notify(
        "Withdrawal request submitted..."
      );

      await tx.wait();

      setWithdrawAmount("");

      notify(
        "Withdrawal request created successfully."
      );

      await refresh();
    } catch (e: any) {
      setError(
        errorText(
          e,
          "Withdrawal request failed."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     EMERGENCY CAPITAL WITHDRAWAL
  ======================================================= */

  async function emergencyCapitalWithdraw() {
    if (
      !contract ||
      !signer
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Emergency Capital Withdrawal permanently closes your active packages and puts your account into Emergency Exit. Continue?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setBusy(true);

      const tx =
        await contract
          .connect(signer)
          .emergencyCapitalWithdraw();

      notify(
        "Emergency withdrawal submitted..."
      );

      await tx.wait();

      notify(
        "Emergency Capital Withdrawal completed."
      );

      await refresh();
    } catch (e: any) {
      setError(
        errorText(
          e,
          "Emergency Capital Withdrawal failed."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  if (!account) {
    return (
      <>
        <LoginScreen
          connect={connectWallet}
          busy={connecting}
          error={error}
        />

        <style jsx global>
          {styles}
        </style>
      </>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="shell">
      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileOpen
            ? "open"
            : ""
        }`}
      >
        <div className="brand">
          <img
            src="/orbi-logo.png"
            alt="ORBI"
          />

          <div>
            <b>ORBIWORLD</b>
            <small>
              WORLD DASHBOARD
            </small>
          </div>
        </div>

        <button
          className="mobileClose"
          onClick={() =>
            setMobileOpen(false)
          }
        >
          ×
        </button>

        <nav>
          <div className="navTitle">
            MAIN
          </div>

          {MAIN_NAV.map(
            (item) => (
              <NavButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={
                  section ===
                  item.id
                }
                onClick={() => {
                  setSection(
                    item.id
                  );

                  setMobileOpen(
                    false
                  );
                }}
              />
            )
          )}

          <button
            className="navGroupButton"
            onClick={() =>
              setHistoryOpen(
                (value) =>
                  !value
              )
            }
          >
            <span>
              HISTORY
            </span>

            <span>
              {historyOpen
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {historyOpen &&
            HISTORY_NAV.map(
              (item) => (
                <NavButton
                  key={
                    item.id
                  }
                  label={
                    item.label
                  }
                  icon="▤"
                  active={
                    section ===
                    item.id
                  }
                  onClick={() => {
                    setSection(
                      item.id
                    );

                    setMobileOpen(
                      false
                    );
                  }}
                />
              )
            )}

          <NavButton
            label="Profile"
            icon="◉"
            active={
              section ===
              "profile"
            }
            onClick={() => {
              setSection(
                "profile"
              );

              setMobileOpen(
                false
              );
            }}
          />
        </nav>

        <a
          className="sideLink"
          href={addressUrl(
            CONTRACT_ADDRESS
          )}
          target="_blank"
          rel="noreferrer"
        >
          View Contract ↗
        </a>
      </aside>

      {/* MAIN */}

      <main className="main">
        <header className="topbar">
          <button
            className="mobileMenu"
            onClick={() =>
              setMobileOpen(true)
            }
          >
            ☰
          </button>

          <div>
            <span className="eyebrow">
              ORBIWORLD • BSC TESTNET
            </span>

            <h1>
              {titleFor(
                section
              )}
            </h1>

            <p>
              Decentralized
              ecosystem
              dashboard
            </p>
          </div>

          <div className="walletActions">
            <div className="walletChip">
              <i />
              {shortAddress(
                account
              )}
            </div>

            <button
              className="secondary"
              onClick={
                refresh
              }
              disabled={
                loading
              }
            >
              {loading
                ? "Syncing..."
                : "Refresh"}
            </button>

            <button
              className="secondary"
              onClick={
                disconnectWallet
              }
            >
              Disconnect
            </button>
          </div>
        </header>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        {error && (
          <div className="error">
            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {!profile ? (
          <RegistrationState
            account={account}
            connect={
              connectWallet
            }
          />
        ) : (
          <DashboardContent
            section={section}
            setSection={
              setSection
            }
            profile={
              profile
            }
            config={
              config
            }
            usdtBalance={
              usdtBalance
            }
            packages={
              packages
            }
            withdrawals={
              withdrawals
            }
            rankHistory={
              rankHistory
            }
            royaltyHistory={
              royaltyHistory
            }
            team={team}
            referralLink={
              referralLink
            }
            stakeAmount={
              stakeAmount
            }
            setStakeAmount={
              setStakeAmount
            }
            activate={
              activatePackage
            }
            topUp={
              topUpPackage
            }
            busy={busy}
            withdrawAmount={
              withdrawAmount
            }
            setWithdrawAmount={
              setWithdrawAmount
            }
            withdrawWallet={
              withdrawWallet
            }
            setWithdrawWallet={
              setWithdrawWallet
            }
            requestWithdrawal={
              requestWithdrawal
            }
            emergencyWithdraw={
              emergencyCapitalWithdraw
            }
          />
        )}
      </main>

      <style jsx global>
        {styles}
      </style>
    </div>
  );
}

/* =========================================================
   NAV COMPONENTS
========================================================= */

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`navBtn ${
        active
          ? "active"
          : ""
      }`}
      onClick={
        onClick
      }
    >
      <span className="navIcon">
        {icon}
      </span>

      <span>
        {label}
      </span>
    </button>
  );
}

function titleFor(
  section: Section
) {
  const titles: Record<
    Section,
    string
  > = {
    overview:
      "Dashboard Overview",

    packages:
      "My Packages",

    earnings:
      "Earnings",

    business:
      "Business Center",

    referral:
      "Referral Center",

      "level-income":
  "Level Income",

    rank:
      "Rank Center",

    royalty:
      "Royalty Center",

    withdrawal:
      "Withdrawal",

    emergency:
      "Emergency Capital Withdrawal",

    "history-staking":
      "Staking History",

    "history-withdrawal":
      "Withdrawal History",

    "history-rank":
      "Rank Reward History",

    "history-royalty":
      "Royalty History",

    profile:
      "Profile",
  };

  return titles[section];
}

/* =========================================================
   LOGIN SCREEN
========================================================= */

function LoginScreen({
  connect,
  busy,
  error,
}: {
  connect: () => void;
  busy: boolean;
  error: string;
}) {
  return (
    <div className="login">
      <div className="loginCard">
        <img
          src="/orbi-logo.png"
          alt="ORBI"
        />

        <span className="eyebrow">
          ORBIWORLD
        </span>

        <h1>
          Decentralized Dashboard
        </h1>

        <p>
          Connect your Web3
          wallet to access
          staking, earnings,
          referrals, rank,
          royalty and
          withdrawals.
        </p>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button
          className="primary"
          onClick={connect}
          disabled={busy}
        >
          {busy
            ? "Connecting..."
            : "Connect Wallet"}
        </button>

        <small>
          BSC Testnet •
          Smart Contract
          Powered
        </small>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTRATION STATE
========================================================= */

function RegistrationState({
  account,
  connect,
}: {
  account: string;
  connect: () => void;
}) {
  return (
    <section className="registrationCard">
      <div className="registrationIcon">
        ◎
      </div>

      <span className="eyebrow">
        ACCOUNT SETUP
      </span>

      <h2>
        ORBI registration
        required
      </h2>

      <p>
        This wallet is
        connected, but no
        ORBI on-chain
        profile was found.
      </p>

      <div className="refExplain">
        <b>
          Connected Wallet
        </b>

        <code>
          {shortAddress(
            account
          )}
        </code>
      </div>

      <button
        className="primary"
        onClick={connect}
      >
        Check Referral &
        Register
      </button>

      <small>
        New users must
        enter through a
        valid ORBI referral
        link.
      </small>
    </section>
  );
}

/* =========================================================
   DASHBOARD CONTENT
========================================================= */

function DashboardContent(
  props: any
) {
  const {
    section,
    setSection,
    profile,
    config,
    usdtBalance,
    packages,
    withdrawals,
    rankHistory,
    royaltyHistory,
    team,
    referralLink,
    stakeAmount,
    setStakeAmount,
    activate,
    topUp,
    busy,
    withdrawAmount,
    setWithdrawAmount,
    withdrawWallet,
    setWithdrawWallet,
    requestWithdrawal,
    emergencyWithdraw,
  } = props;

  const total =
    profile.earningWallet
      .add(
        profile.rankWallet
      )
      .add(
        profile.royaltyWallet
      );

  switch (section) {
    case "overview":
      return (
        <Overview
          profile={profile}
          usdtBalance={
            usdtBalance
          }
          total={total}
          setSection={
            setSection
          }
        />
      );

    case "packages":
      return (
        <Packages
          profile={profile}
          config={config}
          packages={packages}
          amount={
            stakeAmount
          }
          setAmount={
            setStakeAmount
          }
          activate={
            activate
          }
          topUp={
            topUp
          }
          busy={busy}
        />
      );

    case "earnings":
      return (
        <Earnings
          profile={profile}
        />
      );

      case "level-income":
  return (
    <LevelIncome
      profile={profile}
    />
  );

    case "business":
      return (
        <Business
          profile={profile}
          team={team}
        />
      );

    case "referral":
      return (
        <Referral
          profile={profile}
          link={
            referralLink
          }
        />
      );

    case "rank":
      return (
        <Rank
          profile={profile}
        />
      );

    case "royalty":
      return (
        <Royalty
          profile={profile}
          history={
            royaltyHistory
          }
        />
      );

    case "withdrawal":
      return (
        <Withdrawal
          profile={profile}
          config={config}
          amount={
            withdrawAmount
          }
          setAmount={
            setWithdrawAmount
          }
          wallet={
            withdrawWallet
          }
          setWallet={
            setWithdrawWallet
          }
          submit={
            requestWithdrawal
          }
          busy={busy}
        />
      );

    case "emergency":
      return (
        <Emergency
          profile={profile}
          config={config}
          submit={
            emergencyWithdraw
          }
          busy={busy}
        />
      );

    case "history-staking":
      return (
        <History
          title="Staking History"
          headers={[
            "Package",
            "Amount",
            "Max Payout",
            "Status",
            "Block",
            "Tx",
          ]}
        >
          {packages.map(
            (
              item: PackageRow
            ) => (
              <tr
                key={
                  item.packageId
                }
              >
                <td>
                  #
                  {
                    item.packageId
                  }
                </td>

                <td>
                  {money(
                    item.amount
                  )}{" "}
                  USDT
                </td>

                <td>
                  {money(
                    item.amount.mul(
                      MAX_MULTIPLIER
                    )
                  )}{" "}
                  USDT
                </td>

                <td>
                  <Pill
                    value={
                      item.closed
                        ? "CLOSED"
                        : "ACTIVE"
                    }
                  />
                </td>

                <td>
                  {
                    item.block
                  }
                </td>

                <td>
                  <a
                    href={txUrl(
                      item.tx
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            )
          )}
        </History>
      );

    case "history-withdrawal":
      return (
        <History
          title="Withdrawal History"
          headers={[
            "Request",
            "Wallet",
            "Amount",
            "Fee",
            "Net",
            "Status",
            "Tx",
          ]}
        >
          {withdrawals.map(
            (
              item: WithdrawalRow
            ) => (
              <tr
                key={
                  item.requestId
                }
              >
                <td>
                  #
                  {
                    item.requestId
                  }
                </td>

                <td>
                  {walletLabel(
                    item.walletType
                  )}
                </td>

                <td>
                  {money(
                    item.amount
                  )}
                </td>

                <td>
                  {money(
                    item.fee
                  )}
                </td>

                <td>
                  {money(
                    item.netAmount
                  )}
                </td>

                <td>
                  <Pill
                    value={
                      item.status
                    }
                  />
                </td>

                <td>
                  <a
                    href={txUrl(
                      item.tx
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            )
          )}
        </History>
      );

    case "history-rank":
      return (
        <History
          title="Rank Reward History"
          headers={[
            "Rank",
            "Reward",
            "Block",
            "Tx",
          ]}
        >
          {rankHistory.map(
            (
              item: RankRow,
              index: number
            ) => (
              <tr
                key={`${item.block}-${index}`}
              >
                <td>
                  {rankLabel(
                    item.rank
                  )}
                </td>

                <td>
                  {money(
                    item.reward
                  )}{" "}
                  USDT
                </td>

                <td>
                  {
                    item.block
                  }
                </td>

                <td>
                  <a
                    href={txUrl(
                      item.tx
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            )
          )}
        </History>
      );

    case "history-royalty":
      return (
        <History
          title="Royalty History"
          headers={[
            "Royalty",
            "Amount",
            "Block",
            "Tx",
          ]}
        >
          {royaltyHistory.map(
            (
              item: RoyaltyRow,
              index: number
            ) => (
              <tr
                key={`${item.block}-${index}`}
              >
                <td>
                  {royaltyLabel(
                    item.level
                  )}
                </td>

                <td>
                  {money(
                    item.amount
                  )}{" "}
                  USDT
                </td>

                <td>
                  {
                    item.block
                  }
                </td>

                <td>
                  <a
                    href={txUrl(
                      item.tx
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            )
          )}
        </History>
      );

    case "profile":
      return (
        <ProfileView
          profile={
            profile
          }
        />
      );

    default:
      return null;
  }
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  profile,
  usdtBalance,
  total,
  setSection,
}: any) {
  return (
    <>
      <div className="welcome">
        <div>
          <span className="eyebrow">
            WELCOME BACK
          </span>

          <h2>
            Build your
            network. Grow
            your business.
          </h2>

          <p>
            {statusLabel(
              profile.status
            )}{" "}
            • User #
            {profile.id.toString()}
          </p>
        </div>

        <div className="walletBalance">
          <small>
            USDT Wallet
          </small>

          <b>
            {money(
              usdtBalance
            )}
          </b>
        </div>
      </div>

      <div className="grid four">
        <Metric
          title="Earning Wallet"
          value={money(
            profile.earningWallet
          )}
          sub="ROI + Level"
        />

        <Metric
          title="Rank Wallet"
          value={money(
            profile.rankWallet
          )}
          sub="Rank rewards"
        />

        <Metric
          title="Royalty Wallet"
          value={money(
            profile.royaltyWallet
          )}
          sub="Royalty income"
        />

        <Metric
          title="Total Available"
          value={money(total)}
          sub="Withdrawable wallets"
        />
      </div>

      <div className="grid four">
        <Metric
          title="Lifetime ROI"
          value={money(
            profile.totalROIIncome
          )}
          sub="Cumulative"
        />

        <Metric
          title="Lifetime Level"
          value={money(
            profile.totalLevelIncome
          )}
          sub="Cumulative"
        />

        <Metric
          title="Rank Rewards"
          value={money(
            profile.totalRankIncome
          )}
          sub="Cumulative"
        />

        <Metric
          title="Royalty Income"
          value={money(
            profile.totalRoyaltyIncome
          )}
          sub="Cumulative"
        />
      </div>

      <div className="two">
        <Card title="Business Snapshot">
          <Row
            label="Today Business"
            value={`${money(
              profile.todayBusiness
            )} USDT`}
          />

          <Row
            label="30-Day Business"
            value={`${money(
              profile.monthlyBusiness
            )} USDT`}
          />

          <Row
            label="Lifetime Business"
            value={`${money(
              profile.lifetimeBusiness
            )} USDT`}
          />

          <Row
            label="Power Leg"
            value={`${money(
              profile.powerLegBusiness
            )} USDT`}
          />

          <Row
            label="Other Leg"
            value={`${money(
              profile.otherLegBusiness
            )} USDT`}
          />
        </Card>

        <Card title="Current Qualification">
          <Row
            label="Rank"
            value={rankLabel(
              profile.rank
            )}
          />

          <Row
            label="Royalty"
            value={royaltyLabel(
              profile.royalty
            )}
          />

          <Row
            label="Directs"
            value={String(
              profile.directCount
            )}
          />

          <Row
            label="Active Directs"
            value={String(
              profile.activeDirectCount
            )}
          />

          <button
            className="secondary full"
            onClick={() =>
              setSection(
                "referral"
              )
            }
          >
            Open Referral Center
          </button>
        </Card>
      </div>
    </>
  );
}

/* =========================================================
   PACKAGES
========================================================= */

function Packages({
  config,
  packages,
  amount,
  setAmount,
  activate,
  topUp,
  busy,
}: any) {
  return (
    <>
      <Page
        title="My Packages"
        sub="On-chain package activity and staking controls."
      />

      <div className="grid four">
        <Metric
          title="Minimum Stake"
          value={`${money(
            config.minStake
          )} USDT`}
          sub="Contract config"
        />

        <Metric
          title="Minimum Top-up"
          value={`${money(
            config.minTopup
          )} USDT`}
          sub="Contract config"
        />

        <Metric
          title="Daily ROI"
          value={`${(
            config.roiBps / 100
          ).toFixed(2)}%`}
          sub="Contract config"
        />

        <Metric
          title="Max Payout"
          value={`${MAX_MULTIPLIER}×`}
          sub="Per package"
        />
      </div>

      <div className="grid four">
        <Metric
          title="Actual ROI Received"
          value={`${money(
            packages.reduce(
  (
    total: ethers.BigNumber,
    item: PackageRow
  ) => total.add(item.roiPaid),
  ZERO
)
          )} USDT`}
          sub="From package struct (roiPaid)"
        />

        <Metric
          title="Package Count"
          value={String(
            packages.length
          )}
          sub="Detected on-chain"
        />
      </div>

      <Card title="Activate / Top Up">
        <div className="formGrid">
          <input
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            placeholder={`Amount (min ${money(
              config.minStake
            )} USDT)`}
            inputMode="decimal"
          />

          <button
            className="primary"
            disabled={
              busy ||
              !config.stakingEnabled
            }
            onClick={
              activate
            }
          >
            {busy
              ? "Processing..."
              : "Activate Package"}
          </button>

          <button
            className="secondary"
            disabled={
              busy ||
              !config.stakingEnabled
            }
            onClick={
              topUp
            }
          >
            Top Up
          </button>
        </div>

        <p className="muted">
          USDT approval is
          requested only when
          the current allowance
          is insufficient.
        </p>
      </Card>

      {packages.map(
        (item: PackageRow) => {
          const target =
            item.amount.mul(
              MAX_MULTIPLIER
            );

          const dailyROI =
            item.amount
              .mul(config.roiBps)
              .div(10000);

          const progress =
            target.gt(0)
              ? Math.min(
                  100,
                  Number(
                    item.roiPaid
                      .mul(100)
                      .div(target)
                  )
                )
              : 0;

          const remaining =
            target.gt(item.roiPaid)
              ? target.sub(
                  item.roiPaid
                )
              : ZERO;

          const daysTo2x =
            dailyROI.gt(0)
              ? remaining
                  .add(dailyROI)
                  .sub(1)
                  .div(dailyROI)
                  .toNumber()
              : 0;

          return (
            <div
              key={item.packageId}
              className="two"
              style={{
                marginTop: 18,
              }}
            >
              <Card
                title={`Staking Info • Package #${item.packageId}`}
              >
                <Row
                  label="Staked"
                  value={`${money(
                    item.amount
                  )} USDT`}
                />

                <Row
                  label="Target (2×)"
                  value={`${money(
                    target
                  )} USDT`}
                />

                <Row
                  label="Daily ROI"
                  value={`${(
                    config.roiBps /
                    100
                  ).toFixed(2)}%`}
                />

                <Row
                  label="ROI Received"
                  value={`${money(
                    item.roiPaid
                  )} USDT`}
                />

                <Row
                  label="Days to 2×"
                  value={
                    item.closed
                      ? "Completed"
                      : `${daysTo2x} days`
                  }
                />

                <Row
                  label="Package Status"
                  value={
                    item.closed
                      ? "Closed"
                      : "Active"
                  }
                />

                <Progress
                  label="Progress to 2×"
                  value={progress}
                />

                <p className="muted">
                  Progress and days-to-2× are
                  calculated from the package
                  struct stored on-chain.
                </p>

                <p className="muted">
                  Package data is read directly from contract storage.
                </p>
              </Card>


            </div>
          );
        }
      )}

      {packages.length === 0 && (
        <Card title="Staking Info">
          <p className="muted">
            No staking packages were found
            for this wallet on-chain.
          </p>
        </Card>
      )}
    </>
  );
}

/* =========================================================
   EARNINGS
========================================================= */

function Earnings({
  profile,
}: any) {
  return (
    <>
      <Page
        title="Earnings"
        sub="Balances and cumulative income stored by the contract."
      />

      <div className="grid four">
        <Metric
          title="ROI Income"
          value={money(
            profile.totalROIIncome
          )}
          sub="Cumulative"
        />

        <Metric
          title="Level Income"
          value={money(
            profile.totalLevelIncome
          )}
          sub="Cumulative"
        />

        <Metric
          title="Rank Income"
          value={money(
            profile.totalRankIncome
          )}
          sub="Cumulative"
        />

        <Metric
          title="Royalty Income"
          value={money(
            profile.totalRoyaltyIncome
          )}
          sub="Cumulative"
        />
      </div>

      <Card title="Wallet Balances">
        <Row
          label="Earning Wallet (ROI + Level)"
          value={`${money(
            profile.earningWallet
          )} USDT`}
        />

        <Row
          label="Rank Wallet"
          value={`${money(
            profile.rankWallet
          )} USDT`}
        />

        <Row
          label="Royalty Wallet"
          value={`${money(
            profile.royaltyWallet
          )} USDT`}
        />

        <Row
          label="Total Withdrawn"
          value={`${money(
            profile.totalWithdrawn
          )} USDT`}
        />
      </Card>
    </>
  );
}

/* =========================================================
   LEVEL INCOME
========================================================= */

/* =========================================================
   LEVEL INCOME
========================================================= */

function LevelIncome({
  profile,
}: any) {
  return (
    <>
      <div className="sectionHead">
        <div>
          <span className="eyebrow">
            ORBIWORLD
          </span>

          <h2>
            Level Income
          </h2>

          <p>
            Track your network-based level
            income and business qualification.
          </p>
        </div>
      </div>

      {/* TOP METRICS */}

      <div className="grid four">

        <Metric
          title="Total Level Income"
          value={money(
            profile.totalLevelIncome
          )}
          sub="Lifetime cumulative"
        />

        <Metric
          title="Earning Wallet"
          value={money(
            profile.earningWallet
          )}
          sub="ROI + Level"
        />

        <Metric
          title="Direct Members"
          value={String(
            profile.directCount
          )}
          sub="Total direct members"
        />

        <Metric
          title="Active Directs"
          value={String(
            profile.activeDirectCount
          )}
          sub="Currently active"
        />

      </div>

      {/* SUMMARY */}

      <div className="two">

        <Card title="Level Income Summary">

          <Row
            label="Lifetime Level Income"
            value={`${money(
              profile.totalLevelIncome
            )} USDT`}
          />

          <Row
            label="Current Earning Wallet"
            value={`${money(
              profile.earningWallet
            )} USDT`}
          />

          <Row
            label="Lifetime Business"
            value={`${money(
              profile.lifetimeBusiness
            )} USDT`}
          />

          <Row
            label="Monthly Business"
            value={`${money(
              profile.monthlyBusiness
            )} USDT`}
          />

          <Row
            label="Today's Business"
            value={`${money(
              profile.todayBusiness
            )} USDT`}
          />

        </Card>


        <Card title="Network Qualification">

          <Row
            label="Direct Members"
            value={String(
              profile.directCount
            )}
          />

          <Row
            label="Active Directs"
            value={String(
              profile.activeDirectCount
            )}
          />

          <Row
            label="Level Income Status"
            value="Active"
          />

          <Row
            label="Network Business"
            value={`${money(
              profile.lifetimeBusiness
            )} USDT`}
          />

        </Card>

      </div>


      {/* LEVEL STRUCTURE */}

      <Card title="Level Structure">
  <div className="levelTable">

    <div className="levelTableHead">
      <span>LEVEL</span>
      <span>PERCENT</span>
      <span>STATUS</span>
    </div>

    {[
      { level: 1, percent: "10%" },
      { level: 2, percent: "5%" },
      { level: 3, percent: "3%" },
      { level: 4, percent: "2%" },
      { level: 5, percent: "1%" },
      { level: 6, percent: "1%" },
      { level: 7, percent: "1%" },
      { level: 8, percent: "1%" },
      { level: 9, percent: "1%" },
      { level: 10, percent: "1%" },
    ].map((item) => {
      const isOpen =
        Number(profile.activeDirectCount || 0) >= item.level;

      return (
        <div
          className="levelTableRow"
          key={item.level}
        >
          <span>L{item.level}</span>

          <span>
            {item.percent}
          </span>

          <span
            className={
              isOpen
                ? "levelStatus open"
                : "levelStatus pending"
            }
          >
            {isOpen ? "OPEN" : "PENDING"}
          </span>
        </div>
      );
    })}

  </div>
</Card>

    </>
  );
}

/* =========================================================
   BUSINESS
========================================================= */

function Business({
  profile,
  team,
}: any) {
  return (
    <>
      <Page
        title="Business Center"
        sub="Business metrics read directly from your on-chain profile."
      />

      <div className="grid three">
        <Metric
          title="Today"
          value={`${money(
            profile.todayBusiness
          )} USDT`}
          sub="Current day"
        />

        <Metric
          title="30-Day"
          value={`${money(
            profile.monthlyBusiness
          )} USDT`}
          sub="Current month window"
        />

        <Metric
          title="Lifetime"
          value={`${money(
            profile.lifetimeBusiness
          )} USDT`}
          sub="Lifetime business"
        />
      </div>

      <div className="two">
        <Card title="Leg Business">
          <Row
            label="Power Leg"
            value={`${money(
              profile.powerLegBusiness
            )} USDT`}
          />

          <Row
            label="Other Leg"
            value={`${money(
              profile.otherLegBusiness
            )} USDT`}
          />
        </Card>

        <Card title="Team Stats">
          <Row
            label="Direct Referrals"
            value={String(
              profile.directCount
            )}
          />

          <Row
            label="Active Directs"
            value={String(
              profile.activeDirectCount
            )}
          />

          <Row
            label="Sponsor ID"
            value={`#${profile.sponsorId.toString()}`}
          />
        </Card>
      </div>

      <Card title="My Direct Team">
        {team.length === 0 ? (
          <Empty
            text="No direct registrations found yet."
          />
        ) : (
          <div className="team">
            {team.map(
              (member: TeamRow) => (
                <div
                  className="teamRow"
                  key={
                    member.id
                  }
                >
                  <div>
                    <b>
                      #
                      {
                        member.id
                      }
                    </b>

                    <span>
                      {shortAddress(
                        member.wallet
                      )}
                    </span>
                  </div>

                  <div>
                    <span>
                      {statusLabel(
                        member.status
                      )}
                    </span>

                    <small>
                      Directs{" "}
                      {
                        member.directCount
                      }{" "}
                      • Active{" "}
                      {
                        member.activeDirectCount
                      }
                    </small>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>
    </>
  );
}

/* =========================================================
   REFERRAL
========================================================= */

function Referral({
  profile,
  link,
}: any) {
  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(
        link
      );
    } catch {
      return;
    }
  }

  return (
    <>
      <Page
        title="Referral Center"
        sub="Your unique sponsor link is generated from your wallet."
      />

      <Card title="Your Referral Link">
        <div className="refBox">
          <input
            readOnly
            value={link}
          />

          <button
            className="primary"
            onClick={
              copyReferral
            }
          >
            Copy Link
          </button>
        </div>

        <div className="grid three">
          <Metric
            title="Direct Referrals"
            value={String(
              profile.directCount
            )}
            sub="Registered"
          />

          <Metric
            title="Active Directs"
            value={String(
              profile.activeDirectCount
            )}
            sub="Active"
          />

          <Metric
            title="Sponsor ID"
            value={`#${profile.sponsorId.toString()}`}
            sub="Your sponsor"
          />
        </div>
      </Card>

      <Card title="How Registration Works">
        <ol className="steps">
          <li>
            Share your referral
            link.
          </li>

          <li>
            New user connects
            MetaMask.
          </li>

          <li>
            ORBI reads the
            <code>
              ?ref=
            </code>{" "}
            wallet.
          </li>

          <li>
            User confirms one
            registration
            transaction.
          </li>

          <li>
            After confirmation
            the full dashboard
            opens.
          </li>
        </ol>
      </Card>
    </>
  );
}

/* =========================================================
   RANK
========================================================= */

function Rank({
  profile,
}: any) {
  return (
    <>
      <Page
        title="Rank Center"
        sub="Rank qualification uses Power Leg and Other Leg business."
      />

      <div className="grid three">
        <Metric
          title="Current Rank"
          value={rankLabel(
            profile.rank
          )}
          sub="On-chain rank"
        />

        <Metric
          title="Rank Wallet"
          value={`${money(
            profile.rankWallet
          )} USDT`}
          sub="Available"
        />

        <Metric
          title="Total Rank Rewards"
          value={`${money(
            profile.totalRankIncome
          )} USDT`}
          sub="Cumulative"
        />
      </div>

      <div className="rankGrid">
        {RANKS.map(
          (
            rank,
            index
          ) => {
            const achieved =
              profile.rank >=
              index + 1;

            const powerRequirement =
              parseUSDT(
                String(
                  rank.power
                )
              );

            const otherRequirement =
              parseUSDT(
                String(
                  rank.other
                )
              );

            const powerProgress =
              Math.min(
                100,
                Number(
                  profile.powerLegBusiness
                    .mul(100)
                    .div(
                      powerRequirement
                    )
                )
              );

            const otherProgress =
              Math.min(
                100,
                Number(
                  profile.otherLegBusiness
                    .mul(100)
                    .div(
                      otherRequirement
                    )
                )
              );

            return (
              <Card
                key={
                  rank.name
                }
                title={
                  rank.name
                }
              >
                <div className="rankReward">
                  {rank.reward.toLocaleString()}{" "}
                  USDT
                </div>

                <p className="muted">
                  Power{" "}
                  {rank.power.toLocaleString()}{" "}
                  • Other{" "}
                  {rank.other.toLocaleString()}
                </p>

                <Progress
                  label="Power"
                  value={
                    powerProgress
                  }
                />

                <Progress
                  label="Other"
                  value={
                    otherProgress
                  }
                />

                <Pill
                  value={
                    achieved
                      ? "ACHIEVED"
                      : "LOCKED"
                  }
                />
              </Card>
            );
          }
        )}
      </div>
    </>
  );
}

/* =========================================================
   ROYALTY
========================================================= */

function Royalty({
  profile,
  history,
}: any) {
  return (
    <>
      <Page
        title="Royalty Center"
        sub="Royalty qualification is based on business and active directs."
      />

      <div className="grid three">
        <Metric
          title="Current Royalty"
          value={royaltyLabel(
            profile.royalty
          )}
          sub="On-chain level"
        />

        <Metric
          title="Royalty Wallet"
          value={`${money(
            profile.royaltyWallet
          )} USDT`}
          sub="Available"
        />

        <Metric
          title="Total Royalty"
          value={`${money(
            profile.totalRoyaltyIncome
          )} USDT`}
          sub="Cumulative"
        />
      </div>

      <div className="two">
        {ROYALTIES.map(
          (royalty) => {
            const requirement =
              parseUSDT(
                String(
                  royalty.lifetime
                )
              );

            const progress =
              Math.min(
                100,
                Number(
                  profile.lifetimeBusiness
                    .mul(100)
                    .div(
                      requirement
                    )
                )
              );

            return (
              <Card
                key={
                  royalty.name
                }
                title={`Royalty ${royalty.name}`}
              >
                <Row
                  label="Lifetime"
                  value={`${money(
                    profile.lifetimeBusiness
                  )} / ${royalty.lifetime.toLocaleString()} USDT`}
                />

                <Row
                  label="30-Day"
                  value={`${money(
                    profile.monthlyBusiness
                  )} / ${royalty.monthly.toLocaleString()} USDT`}
                />

                <Row
                  label="Active Directs"
                  value={`${profile.activeDirectCount} / ${royalty.directs}`}
                />

                <Progress
                  label="Lifetime"
                  value={
                    progress
                  }
                />
              </Card>
            );
          }
        )}
      </div>

      <History
        title="Royalty History"
        headers={[
          "Level",
          "Amount",
          "Block",
          "Tx",
        ]}
      >
        {history.map(
          (
            item: RoyaltyRow,
            index: number
          ) => (
            <tr
              key={`${item.block}-${index}`}
            >
              <td>
                {royaltyLabel(
                  item.level
                )}
              </td>

              <td>
                {money(
                  item.amount
                )}{" "}
                USDT
              </td>

              <td>
                {item.block}
              </td>

              <td>
                <a
                  href={txUrl(
                    item.tx
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              </td>
            </tr>
          )
        )}
      </History>
    </>
  );
}

/* =========================================================
   WITHDRAWAL
========================================================= */

function Withdrawal({
  profile,
  config,
  amount,
  setAmount,
  wallet,
  setWallet,
  submit,
  busy,
}: any) {
  const available =
    wallet ===
    WalletType.EARNING
      ? profile.earningWallet
      : wallet ===
        WalletType.RANK
      ? profile.rankWallet
      : profile.royaltyWallet;

  const numericAmount =
    Number(
      amount || "0"
    );

  const fee =
    numericAmount *
    (config.feeBps / 10000);

  const net =
    Math.max(
      0,
      numericAmount - fee
    );

  return (
    <>
      <Page
        title="Withdrawal"
        sub="Create an on-chain withdrawal request. Release is handled by the authorized withdrawal role."
      />

      <div className="grid three">
        <Metric
          title="Earning"
          value={`${money(
            profile.earningWallet
          )} USDT`}
          sub="ROI + Level"
        />

        <Metric
          title="Rank"
          value={`${money(
            profile.rankWallet
          )} USDT`}
          sub="Rewards"
        />

        <Metric
          title="Royalty"
          value={`${money(
            profile.royaltyWallet
          )} USDT`}
          sub="Rewards"
        />
      </div>

      <Card title="Request Withdrawal">
        <div className="formGrid">
          <select
            value={wallet}
            onChange={(e) =>
              setWallet(
                Number(
                  e.target.value
                )
              )
            }
          >
            <option value={0}>
              Earning Wallet
            </option>

            <option value={1}>
              Rank Wallet
            </option>

            <option value={2}>
              Royalty Wallet
            </option>
          </select>

          <input
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            placeholder={`Minimum ${money(
              config.minWithdrawal
            )} USDT`}
            inputMode="decimal"
          />

          <button
            className="primary"
            disabled={
              busy ||
              !config.withdrawalEnabled
            }
            onClick={
              submit
            }
          >
            {busy
              ? "Processing..."
              : "Request Withdrawal"}
          </button>
        </div>

        <div className="fee">
          <span>
            Selected Balance{" "}
            <b>
              {money(
                available
              )}{" "}
              USDT
            </b>
          </span>

          <span>
            Estimated Fee{" "}
            <b>
              {fee.toFixed(
                2
              )}{" "}
              USDT
            </b>
          </span>

          <span>
            Estimated Net{" "}
            <b>
              {net.toFixed(
                2
              )}{" "}
              USDT
            </b>
          </span>
        </div>
      </Card>
    </>
  );
}

/* =========================================================
   EMERGENCY CAPITAL WITHDRAWAL
========================================================= */

function Emergency({
  profile,
  config,
  submit,
  busy,
}: any) {
  const eligible =
    profile.status === 2;

  return (
    <>
      <Page
        title="Emergency Capital Withdrawal"
        sub="Permanent exit mechanism provided by the smart contract."
      />

      <Card title="Important">
        <div className="dangerBox">
          <b>
            This action is irreversible.
          </b>

          <p>
            The smart contract
            closes your active
            packages and changes
            your account to
            Emergency Exit.
            Capital return is
            calculated entirely
            by the contract.
          </p>

          <button
            className="danger"
            disabled={
              busy ||
              !config.capitalWithdrawalEnabled ||
              !eligible
            }
            onClick={
              submit
            }
          >
            {busy
              ? "Processing..."
              : "Emergency Capital Withdrawal"}
          </button>

          {!eligible && (
            <p className="muted">
              Emergency withdrawal
              is available only
              while the account is
              ACTIVE.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function ProfileView({
  profile,
}: any) {
  return (
    <>
      <Page
        title="Profile"
        sub="Your on-chain account information."
      />

      <Card title="Wallet & Account">
        <Row
          label="Wallet"
          value={
            profile.wallet
          }
        />

        <Row
          label="User ID"
          value={`#${profile.id.toString()}`}
        />

        <Row
          label="Sponsor ID"
          value={`#${profile.sponsorId.toString()}`}
        />

        <Row
          label="Status"
          value={statusLabel(
            profile.status
          )}
        />

        <Row
          label="Rank"
          value={rankLabel(
            profile.rank
          )}
        />

        <Row
          label="Royalty"
          value={royaltyLabel(
            profile.royalty
          )}
        />

        <Row
          label="Lifetime Withdrawn"
          value={`${money(
            profile.totalWithdrawn
          )} USDT`}
        />

        <div className="actions">
          <a
            className="secondary"
            href={addressUrl(
              profile.wallet
            )}
            target="_blank"
            rel="noreferrer"
          >
            View Wallet ↗
          </a>

          <a
            className="secondary"
            href={addressUrl(
              CONTRACT_ADDRESS
            )}
            target="_blank"
            rel="noreferrer"
          >
            View Contract ↗
          </a>
        </div>
      </Card>
    </>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function History({
  title,
  headers,
  children,
}: {
  title: string;
  headers: string[];
  children: ReactNode;
}) {
  return (
    <Card title={title}>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              {headers.map(
                (header) => (
                  <th
                    key={
                      header
                    }
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {children || (
              <tr>
                <td
                  colSpan={
                    headers.length
                  }
                >
                  <Empty
                    text="No records found in the scanned block range."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Page({
  title,
  sub,
}: {
  title: string;
  sub: string;
}) {
  return (
    <div className="pageHead">
      <span className="eyebrow">
        ORBIWORLD
      </span>

      <h2>
        {title}
      </h2>

      <p>
        {sub}
      </p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="cardHead">
        <h3>
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function Metric({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="metric">
      <span>
        {title}
      </span>

      <b>
        {value}
      </b>

      <small>
        {sub}
      </small>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="row">
      <span>
        {label}
      </span>

      <b>
        {value}
      </b>
    </div>
  );
}

function Progress({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safe =
    Math.max(
      0,
      Math.min(
        100,
        value
      )
    );

  return (
    <div className="progress">
      <div>
        <span>
          {label}
        </span>

        <b>
          {Math.round(
            safe
          )}
          %
        </b>
      </div>

      <i
        style={{
          width: `${safe}%`,
        }}
      />
    </div>
  );
}

function Pill({
  value,
}: {
  value: string;
}) {
  const type =
    value ===
      "APPROVED" ||
    value ===
      "ACTIVE" ||
    value ===
      "ACHIEVED"
      ? "green"
      : value ===
          "REJECTED" ||
        value ===
          "CLOSED"
      ? "red"
      : "yellow";

  return (
    <span
      className={`pill ${type}`}
    >
      {value}
    </span>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = `
*{
  box-sizing:border-box;
}

body{
  margin:0;
  background:#050914;
  color:#eef2ff;
  font-family:Inter,Arial,sans-serif;
}

button,
input,
select{
  font:inherit;
}

.shell{
  min-height:100vh;
  display:flex;
  background:#050914;
}

.sidebar{
  width:270px;
  flex:none;
  border-right:1px solid #182235;
  background:#070c16;
  padding:26px 18px;
  display:flex;
  flex-direction:column;
  position:fixed;
  inset:0 auto 0 0;
  z-index:20;
}

.brand{
  display:flex;
  gap:12px;
  align-items:center;
  padding:5px 10px 28px;
  border-bottom:1px solid #172033;
}

.brand img{
  width:38px;
  height:38px;
  object-fit:contain;
}

.brand b{
  display:block;
  letter-spacing:3px;
  font-size:17px;
}

.brand small{
  display:block;
  color:#71809a;
  font-size:9px;
  letter-spacing:2px;
  margin-top:4px;
}

.navTitle{
  font-size:10px;
  letter-spacing:2px;
  color:#52627d;
  font-weight:800;
  padding:26px 12px 9px;
}

.navBtn,
.navGroupButton{
  width:100%;
  border:0;
  background:transparent;
  color:#91a0b8;
  padding:12px;
  border-radius:11px;
  display:flex;
  align-items:center;
  gap:12px;
  text-align:left;
  cursor:pointer;
  margin:2px 0;
}

.navBtn:hover,
.navGroupButton:hover,
.navBtn.active{
  background:#101a2c;
  color:#fff;
}

.navBtn.active{
  box-shadow:
    inset 0 0 0 1px #263b5d;
}

.navIcon{
  width:18px;
  text-align:center;
  color:#60a5fa;
}

.navGroupButton{
  justify-content:space-between;
  color:#52627d;
  font-size:10px;
  letter-spacing:2px;
  font-weight:800;
  margin-top:12px;
}

.sideLink{
  margin-top:auto;
  color:#6fa9ff;
  text-decoration:none;
  font-size:13px;
  padding:12px;
}

.main{
  margin-left:270px;
  width:calc(100% - 270px);
  padding:30px 34px 60px;
}

.topbar{
  display:flex;
  justify-content:space-between;
  gap:20px;
  align-items:center;
  margin-bottom:24px;
}

.topbar h1{
  margin:5px 0 4px;
  font-size:28px;
}

.topbar p,
.pageHead p{
  margin:0;
  color:#71809a;
}

.eyebrow{
  font-size:10px;
  letter-spacing:2px;
  color:#6d7f9d;
  font-weight:800;
}

.walletActions{
  display:flex;
  align-items:center;
  gap:9px;
}

.walletChip{
  border:1px solid #263a59;
  background:#0c1422;
  border-radius:12px;
  padding:11px 14px;
  display:flex;
  gap:9px;
  align-items:center;
}

.walletChip i{
  width:8px;
  height:8px;
  border-radius:50%;
  background:#38d39f;
}

.primary,
.secondary,
.danger{
  border-radius:10px;
  padding:12px 16px;
  cursor:pointer;
  font-weight:700;
}

.primary{
  background:#2563eb;
  color:#fff;
  border:0;
}

.secondary{
  background:#101827;
  color:#e8eefb;
  border:1px solid #2a3b56;
}

.danger{
  background:#7f1d1d;
  color:#fff;
  border:0;
}

.primary:disabled,
.secondary:disabled,
.danger:disabled{
  opacity:.5;
  cursor:not-allowed;
}

.notice,
.error{
  padding:13px 16px;
  border-radius:12px;
  margin-bottom:18px;
  border:1px solid;
}

.notice{
  background:#082d47;
  border-color:#0b587c;
  color:#9edcff;
}

.error{
  background:#35121a;
  border-color:#6e2535;
  color:#ffb6c2;
  display:flex;
  justify-content:space-between;
  gap:15px;
}

.error button{
  background:none;
  border:0;
  color:inherit;
  cursor:pointer;
}

.content{
  max-width:1250px;
}

.pageHead{
  margin:8px 0 22px;
}

.pageHead h2{
  margin:5px 0;
  font-size:24px;
}

.grid{
  display:grid;
  gap:16px;
  margin-bottom:18px;
}

.grid.four{
  grid-template-columns:repeat(4,1fr);
}

.grid.three{
  grid-template-columns:repeat(3,1fr);
}

.two{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
  margin-bottom:18px;
}

.metric,
.card,
.welcome,
.registrationCard{
  background:#09111f;
  border:1px solid #18263c;
  border-radius:16px;
}

.metric{
  padding:20px;
}

.metric span,
.metric small{
  display:block;
  color:#71809a;
}

.metric b{
  display:block;
  font-size:25px;
  margin:9px 0;
}

.metric small{
  font-size:11px;
}

.card{
  padding:22px;
  margin-bottom:18px;
}

.cardHead{
  margin-bottom:18px;
}

.cardHead h3{
  margin:0;
  font-size:17px;
}

.row{
  display:flex;
  justify-content:space-between;
  gap:20px;
  padding:13px 0;
  border-bottom:1px solid #142033;
}

.row:last-child{
  border-bottom:0;
}

.row span{
  color:#73839c;
}

.row b{
  font-weight:650;
  text-align:right;
  word-break:break-word;
}

.welcome{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:24px;
  margin-bottom:18px;
  background:
    linear-gradient(
      120deg,
      #0b1b2d,
      #09111f
    );
}

.welcome h2{
  margin:7px 0;
}

.welcome p{
  margin:0;
  color:#7e8da5;
}

.walletBalance{
  text-align:right;
}

.walletBalance small{
  display:block;
  color:#70819b;
}

.walletBalance b{
  font-size:28px;
}

.full{
  width:100%;
  margin-top:14px;
}

.formGrid{
  display:grid;
  grid-template-columns:1.3fr 1fr 1fr;
  gap:10px;
}

.formGrid input,
.formGrid select,
.refBox input{
  width:100%;
  background:#050a13;
  color:#fff;
  border:1px solid #25364f;
  border-radius:10px;
  padding:13px 14px;
  outline:none;
}

.formGrid input:focus,
.formGrid select:focus,
.refBox input:focus{
  border-color:#3b82f6;
}

.muted{
  color:#71809a;
}

.tableWrap{
  overflow:auto;
}

.tableWrap table{
  width:100%;
  border-collapse:collapse;
  min-width:650px;
}

.tableWrap th,
.tableWrap td{
  text-align:left;
  padding:13px 12px;
  border-bottom:1px solid #142033;
  font-size:13px;
}

.tableWrap th{
  color:#667894;
  font-size:10px;
  letter-spacing:1px;
  text-transform:uppercase;
}

.tableWrap a{
  color:#69a8ff;
  text-decoration:none;
}

.pill{
  display:inline-block;
  padding:5px 9px;
  border-radius:999px;
  background:#4a3b14;
  color:#f7d879;
  font-size:10px;
  font-weight:800;
}

.pill.green{
  background:#0d3c2c;
  color:#67e8b1;
}

.pill.red{
  background:#451923;
  color:#ff98a9;
}

.rankGrid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px;
  margin-bottom:18px;
}
.levelTable{
  width:100%;
}

.levelTableHead,
.levelTableRow{
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  align-items:center;
  column-gap:20px;
}

.levelTableHead{
  padding:12px 14px;
  background:#101b2d;
  border-radius:10px 10px 0 0;
  color:#6fa9ff;
  font-size:10px;
  font-weight:800;
  letter-spacing:1px;
  text-transform:uppercase;
}

.levelTableRow{
  padding:15px 14px;
  border-bottom:1px solid #142033;
  color:#dce5f5;
  font-size:14px;
}

.levelTableRow:last-child{
  border-bottom:0;
}

.levelTableRow>span:nth-child(2){
  font-weight:700;
}

.levelStatus{
  display:inline-flex;
  width:max-content;
  min-width:78px;
  justify-content:center;
  padding:6px 11px;
  border-radius:999px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
}

.levelStatus.open{
  background:#0b2a20;
  border:1px solid #174d3a;
  color:#4ade80;
}

.levelStatus.pending{
  background:#251f0d;
  border:1px solid #4a3b14;
  color:#f7d879;
}

@media(max-width:600px){

  .levelTableHead,
  .levelTableRow{
    grid-template-columns:1fr .8fr 1.2fr;
    column-gap:10px;
  }

  .levelTableHead,
  .levelTableRow{
    padding-left:10px;
    padding-right:10px;
  }

}
.rankReward{
  font-size:24px;
  font-weight:800;
  margin-bottom:5px;
}

.progress{
  margin:14px 0;
}

.progress>div{
  display:flex;
  justify-content:space-between;
  color:#7c8da7;
  font-size:11px;
  margin-bottom:6px;
}

.progress i{
  display:block;
  height:7px;
  border-radius:99px;
  background:#2563eb;
  max-width:100%;
}

.refBox{
  display:grid;
  grid-template-columns:1fr auto;
  gap:10px;
  margin-bottom:18px;
}

.steps{
  margin:0;
  padding-left:20px;
  color:#9ba9bf;
}

.steps li{
  padding:7px;
}

.teamRow{
  display:flex;
  justify-content:space-between;
  gap:20px;
  padding:14px 0;
  border-bottom:1px solid #142033;
}

.teamRow>div{
  display:flex;
  gap:10px;
  align-items:center;
}

.teamRow span,
.teamRow small{
  color:#71809a;
}

.teamRow small{
  display:block;
}

.fee{
  display:flex;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
  margin-top:16px;
  padding:14px;
  background:#070d17;
  border-radius:10px;
  color:#71809a;
}

.fee b{
  color:#fff;
}

.dangerBox{
  padding:18px;
  border:1px solid #6b2731;
  background:#241017;
  border-radius:12px;
}

.dangerBox p{
  color:#c08d96;
  line-height:1.6;
}

.registrationCard{
  max-width:700px;
  margin:80px auto;
  padding:42px;
  text-align:center;
}

.registrationIcon{
  font-size:34px;
  color:#60a5fa;
}

.registrationCard h2{
  font-size:28px;
  margin:10px 0;
}

.registrationCard p{
  color:#7787a0;
  line-height:1.7;
}

.refExplain{
  margin:20px 0;
  padding:15px;
  border:1px solid #1b2a40;
  background:#070d17;
  border-radius:12px;
}

.refExplain b{
  display:block;
  color:#71809a;
  margin-bottom:8px;
}

.refExplain code{
  color:#dce7f7;
}

.registrationCard small{
  display:block;
  color:#667893;
  margin-top:12px;
}

.login{
  min-height:100vh;
  width:100%;
  display:grid;
  place-items:center;
  padding:20px;
}

.loginCard{
  max-width:520px;
  text-align:center;
  background:#09111f;
  border:1px solid #1c2b42;
  border-radius:22px;
  padding:48px;
}

.loginCard img{
  width:70px;
  height:70px;
  object-fit:contain;
}

.loginCard h1{
  font-size:30px;
  margin:14px 0 8px;
}

.loginCard p{
  color:#7a8aa3;
  line-height:1.7;
}

.loginCard .primary{
  width:100%;
  margin-top:18px;
}

.loginCard small{
  display:block;
  color:#596b86;
  margin-top:14px;
}

.actions{
  display:flex;
  gap:10px;
  margin-top:18px;
}

.actions a{
  text-decoration:none;
}

.mobileMenu,
.mobileClose{
  display:none;
}

.empty{
  padding:30px;
  text-align:center;
  color:#667894;
}

code{
  color:#8fc5ff;
}

@media(max-width:1100px){

  .grid.four{
    grid-template-columns:repeat(2,1fr);
  }

  .rankGrid{
    grid-template-columns:repeat(2,1fr);
  }

  .formGrid{
    grid-template-columns:1fr;
  }

  .walletActions{
    flex-wrap:wrap;
    justify-content:flex-end;
  }
}

@media(max-width:780px){

  .sidebar{
    transform:translateX(-100%);
    transition:.2s;
  }

  .sidebar.open{
    transform:translateX(0);
  }

  .mobileClose{
    display:block;
    position:absolute;
    right:12px;
    top:10px;
    background:none;
    border:0;
    color:#fff;
    font-size:28px;
  }

  .main{
    margin-left:0;
    width:100%;
    padding:20px;
  }

  .mobileMenu{
    display:block;
    background:#101827;
    color:#fff;
    border:1px solid #263852;
    border-radius:9px;
    padding:8px 11px;
  }

  .topbar{
    align-items:flex-start;
    flex-wrap:wrap;
  }

  .walletActions{
    width:100%;
    justify-content:flex-start;
  }

  .walletChip{
    flex:1;
  }

  .two,
  .grid.three,
  .grid.four,
  .rankGrid{
    grid-template-columns:1fr;
  }
    /* =========================================================
   LEVEL INCOME
========================================================= */

.levelInfo{

  display:flex;

  flex-direction:column;

}

.levelInfoRow{

  display:flex;

  justify-content:space-between;

  align-items:center;

  gap:20px;

  padding:18px 0;

  border-bottom:1px solid #142033;

}

.levelInfoRow:last-child{

  border-bottom:0;

}

.levelInfoRow > div{

  display:flex;

  flex-direction:column;

  gap:5px;

}

.levelInfoRow strong{

  color:#e7edf7;

  font-size:15px;

}

.levelInfoRow small{

  color:#71809a;

  font-size:12px;

}

.levelInfoRow > span{

  color:#e7edf7;

  font-weight:700;

  text-align:right;

}

.statusBadge{

  display:inline-flex;

  align-items:center;

  padding:6px 10px;

  border-radius:999px;

  background:#0b2a20;

  border:1px solid #174d3a;

  color:#4ade80 !important;

  font-size:11px;

  letter-spacing:.08em;

}

  .welcome{
    display:block;
  }

  .walletBalance{
    text-align:left;
    margin-top:20px;
  }

  .refBox{
    grid-template-columns:1fr;
  }

  .registrationCard{
    margin:30px auto;
    padding:28px;
  }

  .actions{
    flex-direction:column;
  }
}
  `;