"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ethers } from "ethers";

import {
  CONTRACT_ADDRESS,
  USDT_ADDRESS,
  ORBI_ABI,
  ERC20_ABI,
  BSC_TESTNET,
  PackageStatus,
  UserStatus,
  WalletType,
  formatUSDT,
  parseUSDT,
  shortAddress,
  ensureBscTestnet,
  getContract,
  getUSDTContract,
} from "../../lib/contract";

/* =========================================================
   TYPES
========================================================= */

type Section =
  | "overview"
  | "packages"
  | "business"
  | "earnings"
  | "referral"
  | "withdrawal"
  | "profile";

type UserData = {
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

type PackageData = {
  packageId: string;
  userId: string;
  amount: ethers.BigNumber;
  maxPayout: ethers.BigNumber;
  roiPaid: ethers.BigNumber;
  levelPaid: ethers.BigNumber;
  totalPaid: ethers.BigNumber;
  startTime: number;
  lastProcessedDay: number;
  closedTime: number;
  emergencyClosed: boolean;
  status: number;
  queueIndex: number;
  activeUserPackageIndex: number;
  exists: boolean;
  active: boolean;
};

type DirectUser = {
  id: string;
  wallet: string;
  sponsorId: string;
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

/* =========================================================
   CONSTANTS
========================================================= */

const LEVEL_PERCENTAGES = [
  10,
  5,
  3,
  2,
  1,
  1,
  1,
  1,
  1,
  1,
];

const ZERO = ethers.constants.Zero;

const EMPTY_USER: UserData = {
  id: ZERO,
  wallet: ethers.constants.AddressZero,
  sponsorId: ZERO,
  status: UserStatus.NONE,

  directCount: 0,
  activeDirectCount: 0,

  lifetimeBusiness: ZERO,
  monthlyBusiness: ZERO,
  todayBusiness: ZERO,

  powerLegBusiness: ZERO,
  otherLegBusiness: ZERO,

  earningWallet: ZERO,
  rankWallet: ZERO,
  royaltyWallet: ZERO,

  totalROIIncome: ZERO,
  totalLevelIncome: ZERO,
  totalRankIncome: ZERO,
  totalRoyaltyIncome: ZERO,

  totalWithdrawn: ZERO,

  rank: 0,
  royalty: 0,
};

/* =========================================================
   HELPERS
========================================================= */

function bn(value: any): ethers.BigNumber {
  if (ethers.BigNumber.isBigNumber(value)) {
    return value;
  }

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return ZERO;
  }

  return ethers.BigNumber.from(value);
}

function num(value: any): number {
  return bn(value).toNumber();
}

function userFromTuple(raw: any): UserData {
  return {
    id: bn(raw.id ?? raw[0]),
    wallet: raw.wallet ?? raw[1],
    sponsorId: bn(
      raw.sponsorId ?? raw[2]
    ),
    status: Number(
      raw.status ?? raw[3] ?? 0
    ),

    directCount: Number(
      raw.directCount ?? raw[4] ?? 0
    ),
    activeDirectCount: Number(
      raw.activeDirectCount ??
        raw[5] ??
        0
    ),

    lifetimeBusiness: bn(
      raw.lifetimeBusiness ?? raw[6]
    ),
    monthlyBusiness: bn(
      raw.monthlyBusiness ?? raw[7]
    ),
    todayBusiness: bn(
      raw.todayBusiness ?? raw[8]
    ),

    powerLegBusiness: bn(
      raw.powerLegBusiness ?? raw[9]
    ),
    otherLegBusiness: bn(
      raw.otherLegBusiness ?? raw[10]
    ),

    earningWallet: bn(
      raw.earningWallet ?? raw[11]
    ),
    rankWallet: bn(
      raw.rankWallet ?? raw[12]
    ),
    royaltyWallet: bn(
      raw.royaltyWallet ?? raw[13]
    ),

    totalROIIncome: bn(
      raw.totalROIIncome ?? raw[14]
    ),
    totalLevelIncome: bn(
      raw.totalLevelIncome ?? raw[15]
    ),
    totalRankIncome: bn(
      raw.totalRankIncome ?? raw[16]
    ),
    totalRoyaltyIncome: bn(
      raw.totalRoyaltyIncome ?? raw[17]
    ),

    totalWithdrawn: bn(
      raw.totalWithdrawn ?? raw[18]
    ),

    rank: Number(
      raw.rank ?? raw[19] ?? 0
    ),
    royalty: Number(
      raw.royalty ?? raw[20] ?? 0
    ),
  };
}

function packageFromTuple(
  raw: any,
  activeIds: Set<string>
): PackageData {
  const packageId = bn(
    raw.id ?? raw.packageId ?? raw[0]
  );

  const id = packageId.toString();

  const status = Number(
    raw.status ?? raw[11] ?? 0
  );

  return {
    packageId: id,

    userId: bn(
      raw.userId ?? raw[1]
    ).toString(),

    amount: bn(
      raw.amount ?? raw[2]
    ),

    maxPayout: bn(
      raw.maxPayout ?? raw[3]
    ),

    roiPaid: bn(
      raw.roiPaid ?? raw[4]
    ),

    levelPaid: bn(
      raw.levelPaid ?? raw[5]
    ),

    totalPaid: bn(
      raw.totalPaid ?? raw[6]
    ),

    startTime: num(
      raw.startTime ?? raw[7]
    ),

    lastProcessedDay: num(
      raw.lastProcessedDay ??
        raw[8]
    ),

    closedTime: num(
      raw.closedTime ?? raw[9]
    ),

    emergencyClosed:
      Boolean(
        raw.emergencyClosed ??
          raw[10]
      ),

    status,

    queueIndex: num(
      raw.queueIndex ?? raw[12]
    ),

    activeUserPackageIndex:
      num(
        raw.activeUserPackageIndex ??
          raw[13]
      ),

    exists: Boolean(
      raw.exists ?? raw[14]
    ),

    active:
      activeIds.has(id) &&
      status ===
        PackageStatus.ACTIVE &&
      Boolean(
        raw.exists ?? raw[14]
      ),
  };
}

function directUserFromTuple(
  raw: any
): DirectUser {
  const user = userFromTuple(raw);

  return {
    id: user.id.toString(),
    wallet: user.wallet,
    sponsorId:
      user.sponsorId.toString(),
    status: user.status,
    directCount:
      user.directCount,
    activeDirectCount:
      user.activeDirectCount,

    lifetimeBusiness:
      user.lifetimeBusiness,
    monthlyBusiness:
      user.monthlyBusiness,
    todayBusiness:
      user.todayBusiness,

    powerLegBusiness:
      user.powerLegBusiness,
    otherLegBusiness:
      user.otherLegBusiness,

    earningWallet:
      user.earningWallet,
    rankWallet:
      user.rankWallet,
    royaltyWallet:
      user.royaltyWallet,

    totalROIIncome:
      user.totalROIIncome,
    totalLevelIncome:
      user.totalLevelIncome,
    totalRankIncome:
      user.totalRankIncome,
    totalRoyaltyIncome:
      user.totalRoyaltyIncome,

    totalWithdrawn:
      user.totalWithdrawn,

    rank: user.rank,
    royalty: user.royalty,
  };
}

function formatDate(
  timestamp: number
): string {
  if (!timestamp) {
    return "—";
  }

  return new Date(
    timestamp * 1000
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(
  timestamp: number
): string {
  if (!timestamp) {
    return "—";
  }

  return new Date(
    timestamp * 1000
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function statusLabel(
  status: number
): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "ACTIVE";

    case UserStatus.INACTIVE:
      return "INACTIVE";

    case UserStatus.EMERGENCY_EXIT:
      return "EMERGENCY EXIT";

    case UserStatus.BLACKLISTED:
      return "BLACKLISTED";

    default:
      return "NOT REGISTERED";
  }
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="statCard">
      <div className="statLabel">
        {label}
      </div>

      <div className="statValue">
        {value}
      </div>

      {sub && (
        <div className="statSub">
          {sub}
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="sectionTitle">
      <span className="eyebrow">
        {eyebrow}
      </span>

      <h2>{title}</h2>

      {description && (
        <p>{description}</p>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">
        ○
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function LoginScreen({
  onConnect,
  busy,
  error,
}: {
  onConnect: () => void;
  busy: boolean;
  error: string;
}) {
  return (
    <main className="loginPage">
      <div className="loginCard">
        <div className="logoBox">
          <img
            src="/orbi-logo.png"
            alt="ORBI"
          />
        </div>

        <span className="eyebrow">
          ORBIWORLD
        </span>

        <h1>
          Web3 Dashboard
        </h1>

        <p>
          Connect your wallet to
          access your ORBI account,
          staking, earnings, business
          and referral data.
        </p>

        {error && (
          <div className="errorBox">
            {error}
          </div>
        )}

        <button
          className="primaryButton"
          onClick={onConnect}
          disabled={busy}
        >
          {busy
            ? "Connecting..."
            : "Connect Wallet"}
        </button>

        <div className="networkText">
          BSC Testnet
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   REGISTRATION
========================================================= */

function RegistrationScreen({
  account,
  onRegister,
  busy,
  error,
}: {
  account: string;
  onRegister: (
    sponsor: string
  ) => void;
  busy: boolean;
  error: string;
}) {
  const [sponsor, setSponsor] =
    useState("");

  return (
    <main className="loginPage">
      <div className="loginCard">
        <div className="logoBox">
          <img
            src="/orbi-logo.png"
            alt="ORBI"
          />
        </div>

        <span className="eyebrow">
          ACCOUNT SETUP
        </span>

        <h1>
          Register your wallet
        </h1>

        <p>
          This wallet is not
          registered in the ORBI
          contract.
        </p>

        <div className="walletPreview">
          {shortAddress(account)}
        </div>

        <label className="fieldLabel">
          Sponsor wallet
        </label>

        <input
          className="input"
          value={sponsor}
          onChange={(e) =>
            setSponsor(e.target.value)
          }
          placeholder="0x..."
        />

        <div className="fieldHint">
          Leave empty only if the
          contract permits zero sponsor.
        </div>

        {error && (
          <div className="errorBox">
            {error}
          </div>
        )}

        <button
          className="primaryButton"
          disabled={busy}
          onClick={() =>
            onRegister(
              sponsor.trim() ||
                ethers.constants.AddressZero
            )
          }
        >
          {busy
            ? "Registering..."
            : "Register Wallet"}
        </button>
      </div>
    </main>
  );
}

/* =========================================================
   PACKAGE CARD
========================================================= */

function PackageCard({
  pkg,
}: {
  pkg: PackageData;
}) {
  const roiPercent = pkg.amount.gt(0)
    ? pkg.roiPaid
        .mul(100)
        .div(pkg.amount)
        .toNumber()
    : 0;

  return (
    <div className="packageCard">
      <div className="packageTop">
        <div>
          <span className="packageLabel">
            PACKAGE
          </span>

          <h3>
            #{pkg.packageId}
          </h3>
        </div>

        <span
          className={`statusBadge ${
            pkg.active
              ? "active"
              : "closed"
          }`}
        >
          {pkg.active
            ? "ACTIVE"
            : "CLOSED"}
        </span>
      </div>

      <div className="packageAmount">
        $
        {formatUSDT(pkg.amount)}
      </div>

      <div className="packageGrid">
        <div>
          <span>Max Payout</span>
          <strong>
            $
            {formatUSDT(
              pkg.maxPayout
            )}
          </strong>
        </div>

        <div>
          <span>ROI Paid</span>
          <strong>
            $
            {formatUSDT(
              pkg.roiPaid
            )}
          </strong>
        </div>

        <div>
          <span>Level Paid</span>
          <strong>
            $
            {formatUSDT(
              pkg.levelPaid
            )}
          </strong>
        </div>

        <div>
          <span>Total Paid</span>
          <strong>
            $
            {formatUSDT(
              pkg.totalPaid
            )}
          </strong>
        </div>
      </div>

      <div className="progressBlock">
        <div className="progressHeader">
          <span>
            Payout progress
          </span>

          <span>
            {roiPercent}%
          </span>
        </div>

        <div className="progressTrack">
          <div
            className="progressFill"
            style={{
              width: `${Math.min(
                roiPercent,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="packageFooter">
        <span>
          Started{" "}
          {formatDate(
            pkg.startTime
          )}
        </span>

        <span>
          {pkg.active
            ? "On-chain active"
            : pkg.closedTime
            ? `Closed ${formatDate(
                pkg.closedTime
              )}`
            : "Closed"}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function DashboardPage() {
  const [account, setAccount] =
    useState("");

  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(
      null
    );

  const [contract, setContract] =
    useState<ethers.Contract | null>(
      null
    );

  const [usdt, setUsdt] =
    useState<ethers.Contract | null>(
      null
    );

  const [profile, setProfile] =
    useState<UserData | null>(null);

  const [packages, setPackages] =
    useState<PackageData[]>([]);

  const [directUsers, setDirectUsers] =
    useState<DirectUser[]>([]);

  const [section, setSection] =
    useState<Section>("overview");

  const [loading, setLoading] =
    useState(false);

  const [txBusy, setTxBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [info, setInfo] =
    useState("");

  const [stakeAmount, setStakeAmount] =
    useState("");

  const [withdrawAmount, setWithdrawAmount] =
    useState("");

  const [withdrawWallet, setWithdrawWallet] =
    useState<WalletType>(
      WalletType.EARNING
    );

  const [mobileOpen, setMobileOpen] =
    useState(false);

  /* =======================================================
     CONNECT WALLET
  ======================================================= */

  const connectWallet =
    useCallback(async () => {
      try {
        setError("");
        setInfo("");
        setLoading(true);

        if (!window.ethereum) {
          throw new Error(
            "MetaMask is not installed."
          );
        }

        await ensureBscTestnet();

        const web3 =
          new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
          );

        await web3.send(
          "eth_requestAccounts",
          []
        );

        const signer =
          web3.getSigner();

        const address =
          await signer.getAddress();

        const network =
          await web3.getNetwork();

        if (
          network.chainId !==
          BSC_TESTNET.chainId
        ) {
          throw new Error(
            "Please switch to BSC Testnet."
          );
        }

        const orbi =
          getContract(signer);

        const token =
          getUSDTContract(signer);

        setProvider(web3);
        setAccount(address);
        setContract(orbi);
        setUsdt(token);
      } catch (err: any) {
        setError(
          err?.message ||
            "Wallet connection failed."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile =
    useCallback(
      async (
        c: ethers.Contract,
        wallet: string
      ) => {
        const registered =
          await c.isRegistered(
            wallet
          );

        if (!registered) {
          setProfile(null);
          setPackages([]);
          setDirectUsers([]);
          return false;
        }

        const raw =
          await c.myProfile();

        const parsed =
          userFromTuple(raw);

        setProfile(parsed);

        return true;
      },
      []
    );

  /* =======================================================
     LOAD PACKAGES
     
     NO EVENT SCANNING.
     NO queryFilter.
     NO PackageActivated.
     NO PackageTopup.
     NO PackageClosed.

     SOURCE:
       getUserPackages()
       getActiveUserPackages()
       getPackage()
  ======================================================= */

  const loadPackages =
    useCallback(
      async (
        c: ethers.Contract,
        userId: ethers.BigNumber
      ) => {
        const allRaw =
          await c.getUserPackages(
            userId
          );

        const activeRaw =
          await c.getActiveUserPackages(
            userId
          );

        const allIds: string[] =
  (allRaw || []).map(
    (id: any): string =>
      bn(id).toString()
  );

const activeIds: string[] =
  (activeRaw || []).map(
    (id: any): string =>
      bn(id).toString()
  );

const activeSet: Set<string> =
  new Set<string>(activeIds);

        const rows: PackageData[] = [];

        for (const id of allIds) {
          try {
            const raw =
              await c.getPackage(id);

            const pkg =
              packageFromTuple(
                raw,
                activeSet
              );

            if (pkg.exists) {
              rows.push(pkg);
            }
          } catch (packageError) {
            console.warn(
              `Unable to read package ${id}`,
              packageError
            );
          }
        }

        rows.sort(
          (a, b) =>
            Number(b.packageId) -
            Number(a.packageId)
        );

        setPackages(rows);
      },
      []
    );

  /* =======================================================
     LOAD DIRECT USERS
  ======================================================= */

  const loadDirectUsers =
    useCallback(
      async (
        c: ethers.Contract,
        userId: ethers.BigNumber
      ) => {
        try {
          const raw =
            await c.getDirectUsers(
              userId
            );

          const users =
            (raw || []).map(
              (item: any) =>
                directUserFromTuple(
                  item
                )
            );

          setDirectUsers(users);
        } catch (err) {
          console.warn(
            "Direct users read failed:",
            err
          );

          setDirectUsers([]);
        }
      },
      []
    );

  /* =======================================================
     LOAD ALL ON-CHAIN DATA
  ======================================================= */

  const loadDashboard =
    useCallback(
      async (
        c: ethers.Contract,
        wallet: string
      ) => {
        try {
          setError("");

          const registered =
            await c.isRegistered(
              wallet
            );

          if (!registered) {
            setProfile(null);
            setPackages([]);
            setDirectUsers([]);
            return;
          }

          const rawProfile =
            await c.myProfile();

          const parsed =
            userFromTuple(
              rawProfile
            );

          setProfile(parsed);

          /*
           * Direct package storage reads.
           */
          await loadPackages(
            c,
            parsed.id
          );

          /*
           * Direct team read.
           */
          await loadDirectUsers(
            c,
            parsed.id
          );
        } catch (err: any) {
          console.error(
            "Dashboard load failed:",
            err
          );

          setError(
            err?.reason ||
              err?.data?.message ||
              err?.message ||
              "Unable to read dashboard data from the contract."
          );
        }
      },
      [
        loadPackages,
        loadDirectUsers,
      ]
    );

  /* =======================================================
     INITIAL WALLET CHECK
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (
        !window.ethereum
      ) {
        return;
      }

      try {
        const web3 =
          new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
          );

        const accounts =
          await web3.listAccounts();

        if (
          !mounted ||
          accounts.length === 0
        ) {
          return;
        }

        const network =
          await web3.getNetwork();

        if (
          network.chainId !==
          BSC_TESTNET.chainId
        ) {
          return;
        }

        const signer =
          web3.getSigner();

        const address =
          accounts[0];

        setProvider(web3);
        setAccount(address);
        setContract(
          getContract(signer)
        );
        setUsdt(
          getUSDTContract(signer)
        );
      } catch {
        // Wallet can remain disconnected.
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     WALLET EVENTS
  ======================================================= */

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccounts =
      (accounts: string[]) => {
        if (
          !accounts ||
          accounts.length === 0
        ) {
          setAccount("");
          setProfile(null);
          setPackages([]);
          setDirectUsers([]);
          return;
        }

        const next =
          accounts[0];

        setAccount(next);
      };

    const handleChain = () => {
      window.location.reload();
    };

    window.ethereum.on(
      "accountsChanged",
      handleAccounts
    );

    window.ethereum.on(
      "chainChanged",
      handleChain
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccounts
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChain
      );
    };
  }, []);

  /* =======================================================
     REFRESH WHEN CONTRACT IS READY
  ======================================================= */

  useEffect(() => {
  if (!contract || !account) {
    return;
  }

  const currentContract: ethers.Contract =
    contract;

  const currentAccount: string =
    account;

  let cancelled = false;

  async function run() {
    setLoading(true);

    try {
      if (!cancelled) {
        await loadDashboard(
          currentContract,
          currentAccount
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  run();

  return () => {
    cancelled = true;
  };
}, [
  contract,
  account,
  loadDashboard,
]);

  /* =======================================================
     REGISTER
  ======================================================= */

  const register =
    useCallback(
      async (
        sponsorWallet: string
      ) => {
        if (!contract) {
          return;
        }

        try {
          setTxBusy(true);
          setError("");
          setInfo("");

          if (
            !ethers.utils.isAddress(
              sponsorWallet
            )
          ) {
            throw new Error(
              "Invalid sponsor wallet address."
            );
          }

          const tx =
            await contract.registerOnly(
              sponsorWallet
            );

          setInfo(
            "Registration transaction submitted. Waiting for confirmation..."
          );

          await tx.wait();

          setInfo(
            "Registration successful."
          );

          await loadDashboard(
            contract,
            account
          );
        } catch (err: any) {
          setError(
            err?.reason ||
              err?.data?.message ||
              err?.message ||
              "Registration failed."
          );
        } finally {
          setTxBusy(false);
        }
      },
      [
        contract,
        account,
        loadDashboard,
      ]
    );

  /* =======================================================
     APPROVE USDT
  ======================================================= */

  const approveUSDT =
    useCallback(
      async (
        amount: ethers.BigNumber
      ) => {
        if (!usdt) {
          throw new Error(
            "USDT contract is not connected."
          );
        }

        const allowance =
          await usdt.allowance(
            account,
            CONTRACT_ADDRESS
          );

        if (
          allowance.gte(amount)
        ) {
          return;
        }

        setInfo(
          "Approving USDT..."
        );

        const tx =
          await usdt.approve(
            CONTRACT_ADDRESS,
            amount
          );

        await tx.wait();

        setInfo(
          "USDT approval confirmed."
        );
      },
      [
        usdt,
        account,
      ]
    );

  /* =======================================================
     FIRST STAKE
  ======================================================= */

  const activate =
    useCallback(async () => {
      if (
        !contract ||
        !usdt
      ) {
        return;
      }

      try {
        setTxBusy(true);
        setError("");
        setInfo("");

        if (!stakeAmount) {
          throw new Error(
            "Enter stake amount."
          );
        }

        const amount =
          parseUSDT(
            stakeAmount
          );

        await approveUSDT(
          amount
        );

        setInfo(
          "Activating account..."
        );

        const tx =
          await contract.activateAccount(
            amount
          );

        await tx.wait();

        setInfo(
          "Package activated successfully."
        );

        setStakeAmount("");

        await loadDashboard(
          contract,
          account
        );
      } catch (err: any) {
        setError(
          err?.reason ||
            err?.data?.message ||
            err?.message ||
            "Activation failed."
        );
      } finally {
        setTxBusy(false);
      }
    }, [
      contract,
      usdt,
      stakeAmount,
      approveUSDT,
      account,
      loadDashboard,
    ]);

  /* =======================================================
     TOP UP
  ======================================================= */

  const topUp =
    useCallback(async () => {
      if (
        !contract ||
        !usdt
      ) {
        return;
      }

      try {
        setTxBusy(true);
        setError("");
        setInfo("");

        if (!stakeAmount) {
          throw new Error(
            "Enter top-up amount."
          );
        }

        const amount =
          parseUSDT(
            stakeAmount
          );

        await approveUSDT(
          amount
        );

        setInfo(
          "Creating top-up package..."
        );

        const tx =
          await contract.topUp(
            amount
          );

        await tx.wait();

        setInfo(
          "Top-up package created successfully."
        );

        setStakeAmount("");

        await loadDashboard(
          contract,
          account
        );
      } catch (err: any) {
        setError(
          err?.reason ||
            err?.data?.message ||
            err?.message ||
            "Top-up failed."
        );
      } finally {
        setTxBusy(false);
      }
    }, [
      contract,
      usdt,
      stakeAmount,
      approveUSDT,
      account,
      loadDashboard,
    ]);

  /* =======================================================
     WITHDRAW
  ======================================================= */

  const withdraw =
    useCallback(async () => {
      if (!contract) {
        return;
      }

      try {
        setTxBusy(true);
        setError("");
        setInfo("");

        if (!withdrawAmount) {
          throw new Error(
            "Enter withdrawal amount."
          );
        }

        const amount =
          parseUSDT(
            withdrawAmount
          );

        setInfo(
          "Submitting withdrawal request..."
        );

        const tx =
          await contract.requestWithdraw(
            withdrawWallet,
            amount
          );

        await tx.wait();

        setInfo(
          "Withdrawal request submitted successfully."
        );

        setWithdrawAmount("");

        await loadDashboard(
          contract,
          account
        );
      } catch (err: any) {
        setError(
          err?.reason ||
            err?.data?.message ||
            err?.message ||
            "Withdrawal failed."
        );
      } finally {
        setTxBusy(false);
      }
    }, [
      contract,
      withdrawAmount,
      withdrawWallet,
      account,
      loadDashboard,
    ]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const activePackages =
    useMemo(
      () =>
        packages.filter(
          (pkg) =>
            pkg.active &&
            pkg.status ===
              PackageStatus.ACTIVE
        ),
      [packages]
    );

  const closedPackages =
    useMemo(
      () =>
        packages.filter(
          (pkg) =>
            !pkg.active ||
            pkg.status !==
              PackageStatus.ACTIVE
        ),
      [packages]
    );

  const totalStaked =
    useMemo(
      () =>
        packages.reduce(
          (sum, pkg) =>
            sum.add(pkg.amount),
          ZERO
        ),
      [packages]
    );

  const activeCapital =
    useMemo(
      () =>
        activePackages.reduce(
          (sum, pkg) =>
            sum.add(pkg.amount),
          ZERO
        ),
      [activePackages]
    );

  const totalPackageROI =
    useMemo(
      () =>
        packages.reduce(
          (sum, pkg) =>
            sum.add(pkg.roiPaid),
          ZERO
        ),
      [packages]
    );

  const activePackage =
    activePackages[0] ||
    null;

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigation: {
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
      icon: "◈",
    },
    {
      id: "business",
      label: "Business",
      icon: "◎",
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: "$",
    },
    {
      id: "referral",
      label: "Referral",
      icon: "↗",
    },
    {
      id: "withdrawal",
      label: "Withdrawal",
      icon: "↙",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "●",
    },
  ];

  /* =======================================================
     DISCONNECTED
  ======================================================= */

  if (!account) {
    return (
      <>
        <style jsx global>{GLOBAL_CSS}</style>

        <LoginScreen
          onConnect={connectWallet}
          busy={loading}
          error={error}
        />
      </>
    );
  }

  /* =======================================================
     REGISTERED CHECK
  ======================================================= */

  if (
    !profile &&
    !loading
  ) {
    return (
      <>
        <style jsx global>{GLOBAL_CSS}</style>

        <RegistrationScreen
          account={account}
          onRegister={register}
          busy={txBusy}
          error={error}
        />
      </>
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    !profile
  ) {
    return (
      <>
        <style jsx global>{GLOBAL_CSS}</style>

        <main className="loadingPage">
          <div className="loader" />
          <p>
            Reading ORBI data
            from blockchain...
          </p>
        </main>
      </>
    );
  }

  if (!profile) {
    return null;
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <>
      <style jsx global>
        {GLOBAL_CSS}
      </style>

      <div className="appShell">
        {/* MOBILE OVERLAY */}
        {mobileOpen && (
          <div
            className="mobileOverlay"
            onClick={() =>
              setMobileOpen(false)
            }
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`sidebar ${
            mobileOpen
              ? "sidebarOpen"
              : ""
          }`}
        >
          <div className="brand">
            <img
              src="/orbi-logo.png"
              alt="ORBI"
            />

            <div>
              <strong>
                ORBI
              </strong>

              <span>
                WORLD
              </span>
            </div>
          </div>

          <div className="walletMini">
            <span>
              CONNECTED
            </span>

            <code>
              {shortAddress(
                account
              )}
            </code>
          </div>

          <nav className="nav">
            {navigation.map(
              (item) => (
                <button
                  key={item.id}
                  className={`navButton ${
                    section ===
                    item.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSection(
                      item.id
                    );
                    setMobileOpen(
                      false
                    );
                  }}
                >
                  <span className="navIcon">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </button>
              )
            )}
          </nav>

          <div className="sidebarBottom">
            <a
              href={`${BSC_TESTNET.explorer}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="contractLink"
            >
              View Contract ↗
            </a>

            <div className="networkPill">
              ● BSC Testnet
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          {/* HEADER */}
          <header className="header">
            <button
              className="menuButton"
              onClick={() =>
                setMobileOpen(
                  !mobileOpen
                )
              }
            >
              ☰
            </button>

            <div>
              <span className="headerEyebrow">
                ORBIWORLD
              </span>

              <h1>
                {section ===
                  "overview" &&
                  "Dashboard Overview"}

                {section ===
                  "packages" &&
                  "My Packages"}

                {section ===
                  "business" &&
                  "Business Center"}

                {section ===
                  "earnings" &&
                  "Earnings"}

                {section ===
                  "referral" &&
                  "Referral Center"}

                {section ===
                  "withdrawal" &&
                  "Withdrawal"}

                {section ===
                  "profile" &&
                  "My Profile"}
              </h1>
            </div>

            <div className="headerActions">
              <button
                className="refreshButton"
                disabled={
                  loading
                }
                onClick={async () => {
                  if (!contract) {
                    return;
                  }

                  setLoading(true);

                  try {
                    await loadDashboard(
                      contract,
                      account
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                ↻ Refresh
              </button>

              <div className="accountChip">
                <span className="onlineDot" />
                {shortAddress(
                  account
                )}
              </div>
            </div>
          </header>

          {/* NOTICES */}
          {(error || info) && (
            <div className="noticeWrap">
              {error && (
                <div className="errorBox">
                  {error}
                </div>
              )}

              {info && (
                <div className="infoBox">
                  {info}
                </div>
              )}
            </div>
          )}

          {/* =================================================
              OVERVIEW
          ================================================= */}
          {section ===
            "overview" && (
            <section className="content">
              <SectionTitle
                eyebrow="ACCOUNT"
                title={`Welcome, User #${profile.id.toString()}`}
                description="Live account information read directly from the ORBI smart contract."
              />

              <div className="statsGrid">
                <StatCard
                  label="Active Packages"
                  value={activePackages.length.toString()}
                  sub={`of ${packages.length} total`}
                />

                <StatCard
                  label="Active Capital"
                  value={`$${formatUSDT(
                    activeCapital
                  )}`}
                  sub="On-chain"
                />

                <StatCard
                  label="ROI Income"
                  value={`$${formatUSDT(
                    profile.totalROIIncome
                  )}`}
                  sub="Lifetime"
                />

                <StatCard
                  label="Level Income"
                  value={`$${formatUSDT(
                    profile.totalLevelIncome
                  )}`}
                  sub="Lifetime"
                />
              </div>

              <div className="overviewGrid">
                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        ACTIVE PACKAGE
                      </span>

                      <h3>
                        Current Staking
                      </h3>
                    </div>

                    <button
                      className="textButton"
                      onClick={() =>
                        setSection(
                          "packages"
                        )
                      }
                    >
                      View All →
                    </button>
                  </div>

                  {activePackage ? (
                    <PackageCard
                      pkg={
                        activePackage
                      }
                    />
                  ) : (
                    <EmptyState
                      title="No active package"
                      description="No package with ACTIVE status is currently present in the active package list."
                    />
                  )}
                </div>

                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        ACCOUNT STATUS
                      </span>

                      <h3>
                        On-chain Profile
                      </h3>
                    </div>
                  </div>

                  <div className="profileSummary">
                    <div>
                      <span>
                        Status
                      </span>

                      <strong className="greenText">
                        {statusLabel(
                          profile.status
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        User ID
                      </span>

                      <strong>
                        #
                        {profile.id.toString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Sponsor
                      </span>

                      <strong>
                        #
                        {profile.sponsorId.toString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Directs
                      </span>

                      <strong>
                        {
                          profile.directCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Active Directs
                      </span>

                      <strong>
                        {
                          profile.activeDirectCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Rank
                      </span>

                      <strong>
                        R{profile.rank}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="statsGrid">
                <StatCard
                  label="Lifetime Business"
                  value={`$${formatUSDT(
                    profile.lifetimeBusiness
                  )}`}
                />

                <StatCard
                  label="Monthly Business"
                  value={`$${formatUSDT(
                    profile.monthlyBusiness
                  )}`}
                />

                <StatCard
                  label="Today Business"
                  value={`$${formatUSDT(
                    profile.todayBusiness
                  )}`}
                />

                <StatCard
                  label="Total Withdrawn"
                  value={`$${formatUSDT(
                    profile.totalWithdrawn
                  )}`}
                />
              </div>
            </section>
          )}

          {/* =================================================
              PACKAGES
          ================================================= */}
          {section ===
            "packages" && (
            <section className="content">
              <SectionTitle
                eyebrow="STAKING"
                title="My Packages"
                description="Complete staking history and current active packages from contract storage."
              />

              <div className="statsGrid">
                <StatCard
                  label="Total Packages"
                  value={packages.length.toString()}
                />

                <StatCard
                  label="Active"
                  value={activePackages.length.toString()}
                />

                <StatCard
                  label="Closed"
                  value={closedPackages.length.toString()}
                />

                <StatCard
                  label="Total Staked"
                  value={`$${formatUSDT(
                    totalStaked
                  )}`}
                />
              </div>

              <div className="packageToolbar">
                <div>
                  <strong>
                    Active Packages
                  </strong>

                  <span>
                    {activePackages.length} on-chain
                  </span>
                </div>
              </div>

              {activePackages.length >
              0 ? (
                <div className="packageList">
                  {activePackages.map(
                    (pkg) => (
                      <PackageCard
                        key={
                          pkg.packageId
                        }
                        pkg={pkg}
                      />
                    )
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No active packages"
                  description="The contract returned no active package IDs for this user."
                />
              )}

              <div className="historyHeading">
                <h3>
                  Staking History
                </h3>

                <span>
                  {packages.length} packages
                </span>
              </div>

              {packages.length >
              0 ? (
                <div className="packageList">
                  {packages.map(
                    (pkg) => (
                      <PackageCard
                        key={
                          `history-${pkg.packageId}`
                        }
                        pkg={pkg}
                      />
                    )
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No staking history"
                  description="No package IDs were returned by getUserPackages()."
                />
              )}
            </section>
          )}

          {/* =================================================
              BUSINESS
          ================================================= */}
          {section ===
            "business" && (
            <section className="content">
              <SectionTitle
                eyebrow="NETWORK"
                title="Business Center"
                description="Business figures are read from the user's on-chain profile."
              />

              <div className="statsGrid">
                <StatCard
                  label="Lifetime Business"
                  value={`$${formatUSDT(
                    profile.lifetimeBusiness
                  )}`}
                />

                <StatCard
                  label="Monthly Business"
                  value={`$${formatUSDT(
                    profile.monthlyBusiness
                  )}`}
                />

                <StatCard
                  label="Today Business"
                  value={`$${formatUSDT(
                    profile.todayBusiness
                  )}`}
                />

                <StatCard
                  label="Direct Users"
                  value={profile.directCount.toString()}
                />
              </div>

              <div className="businessGrid">
                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        LEGS
                      </span>

                      <h3>
                        Business Distribution
                      </h3>
                    </div>
                  </div>

                  <div className="businessRows">
                    <div>
                      <span>
                        Power Leg
                      </span>

                      <strong>
                        $
                        {formatUSDT(
                          profile.powerLegBusiness
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Other Leg
                      </span>

                      <strong>
                        $
                        {formatUSDT(
                          profile.otherLegBusiness
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Active Directs
                      </span>

                      <strong>
                        {
                          profile.activeDirectCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Directs
                      </span>

                      <strong>
                        {
                          profile.directCount
                        }
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        TEAM
                      </span>

                      <h3>
                        Direct Team
                      </h3>
                    </div>

                    <button
                      className="textButton"
                      onClick={() =>
                        setSection(
                          "referral"
                        )
                      }
                    >
                      Open →
                    </button>
                  </div>

                  {directUsers.length >
                  0 ? (
                    <div className="teamMiniList">
                      {directUsers
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            user
                          ) => (
                            <div
                              className="teamMini"
                              key={
                                user.id
                              }
                            >
                              <div className="avatar">
                                {user.id}
                              </div>

                              <div>
                                <strong>
                                  User #
                                  {
                                    user.id
                                  }
                                </strong>

                                <span>
                                  {
                                    shortAddress(
                                      user.wallet
                                    )
                                  }
                                </span>
                              </div>

                              <b>
                                {statusLabel(
                                  user.status
                                )}
                              </b>
                            </div>
                          )
                        )}
                    </div>
                  ) : (
                    <EmptyState
                      title="No direct users"
                      description="The contract returned an empty direct-user list."
                    />
                  )}
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              EARNINGS
          ================================================= */}
          {section ===
            "earnings" && (
            <section className="content">
              <SectionTitle
                eyebrow="INCOME"
                title="Earnings"
                description="Lifetime income totals stored in your ORBI profile."
              />

              <div className="statsGrid">
                <StatCard
                  label="ROI Income"
                  value={`$${formatUSDT(
                    profile.totalROIIncome
                  )}`}
                />

                <StatCard
                  label="Level Income"
                  value={`$${formatUSDT(
                    profile.totalLevelIncome
                  )}`}
                />

                <StatCard
                  label="Rank Income"
                  value={`$${formatUSDT(
                    profile.totalRankIncome
                  )}`}
                />

                <StatCard
                  label="Royalty Income"
                  value={`$${formatUSDT(
                    profile.totalRoyaltyIncome
                  )}`}
                />
              </div>

              <div className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      LEVEL PLAN
                    </span>

                    <h3>
                      Level Income
                    </h3>
                  </div>
                </div>

                <div className="levelGrid">
                  {LEVEL_PERCENTAGES.map(
                    (
                      percentage,
                      index
                    ) => (
                      <div
                        className="levelCard"
                        key={
                          index
                        }
                      >
                        <span>
                          Level{" "}
                          {index + 1}
                        </span>

                        <strong>
                          {percentage}%
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      PACKAGE ROI
                    </span>

                    <h3>
                      Package ROI Summary
                    </h3>
                  </div>
                </div>

                <div className="businessRows">
                  <div>
                    <span>
                      Package ROI Paid
                    </span>

                    <strong>
                      $
                      {formatUSDT(
                        totalPackageROI
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Profile ROI Income
                    </span>

                    <strong>
                      $
                      {formatUSDT(
                        profile.totalROIIncome
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              REFERRAL
          ================================================= */}
          {section ===
            "referral" && (
            <section className="content">
              <SectionTitle
                eyebrow="NETWORK"
                title="Referral Center"
                description="Direct users are loaded directly from the contract's referral storage."
              />

              <div className="statsGrid">
                <StatCard
                  label="Direct Referrals"
                  value={profile.directCount.toString()}
                />

                <StatCard
                  label="Active Directs"
                  value={profile.activeDirectCount.toString()}
                />

                <StatCard
                  label="Sponsor ID"
                  value={`#${profile.sponsorId.toString()}`}
                />

                <StatCard
                  label="User ID"
                  value={`#${profile.id.toString()}`}
                />
              </div>

              <div className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      DIRECT TEAM
                    </span>

                    <h3>
                      My Direct Referrals
                    </h3>
                  </div>

                  <span>
                    {directUsers.length} users
                  </span>
                </div>

                {directUsers.length >
                0 ? (
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            User
                          </th>

                          <th>
                            Wallet
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Business
                          </th>

                          <th>
                            Directs
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {directUsers.map(
                          (
                            user
                          ) => (
                            <tr
                              key={
                                user.id
                              }
                            >
                              <td>
                                <strong>
                                  #
                                  {
                                    user.id
                                  }
                                </strong>
                              </td>

                              <td>
                                <code>
                                  {
                                    shortAddress(
                                      user.wallet
                                    )
                                  }
                                </code>
                              </td>

                              <td>
                                <span
                                  className={`statusText ${
                                    user.status ===
                                    UserStatus.ACTIVE
                                      ? "greenText"
                                      : ""
                                  }`}
                                >
                                  {statusLabel(
                                    user.status
                                  )}
                                </span>
                              </td>

                              <td>
                                $
                                {formatUSDT(
                                  user.lifetimeBusiness
                                )}
                              </td>

                              <td>
                                {
                                  user.directCount
                                }
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No referrals found"
                    description="getDirectUsers() returned no direct users."
                  />
                )}
              </div>
            </section>
          )}

          {/* =================================================
              WITHDRAWAL
          ================================================= */}
          {section ===
            "withdrawal" && (
            <section className="content">
              <SectionTitle
                eyebrow="WALLET"
                title="Withdrawal"
                description="Create a withdrawal request through the deployed ORBI contract."
              />

              <div className="walletGrid">
                <div className="walletBalance">
                  <span>
                    Earning Wallet
                  </span>

                  <strong>
                    $
                    {formatUSDT(
                      profile.earningWallet
                    )}
                  </strong>
                </div>

                <div className="walletBalance">
                  <span>
                    Rank Wallet
                  </span>

                  <strong>
                    $
                    {formatUSDT(
                      profile.rankWallet
                    )}
                  </strong>
                </div>

                <div className="walletBalance">
                  <span>
                    Royalty Wallet
                  </span>

                  <strong>
                    $
                    {formatUSDT(
                      profile.royaltyWallet
                    )}
                  </strong>
                </div>
              </div>

              <div className="withdrawGrid">
                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        REQUEST
                      </span>

                      <h3>
                        Withdraw USDT
                      </h3>
                    </div>
                  </div>

                  <label className="fieldLabel">
                    Wallet Type
                  </label>

                  <select
                    className="input"
                    value={
                      withdrawWallet
                    }
                    onChange={(e) =>
                      setWithdrawWallet(
                        Number(
                          e.target.value
                        ) as WalletType
                      )
                    }
                  >
                    <option
                      value={
                        WalletType.EARNING
                      }
                    >
                      Earning Wallet
                    </option>

                    <option
                      value={
                        WalletType.RANK
                      }
                    >
                      Rank Wallet
                    </option>

                    <option
                      value={
                        WalletType.ROYALTY
                      }
                    >
                      Royalty Wallet
                    </option>
                  </select>

                  <label className="fieldLabel">
                    Amount
                  </label>

                  <input
                    className="input"
                    value={
                      withdrawAmount
                    }
                    onChange={(e) =>
                      setWithdrawAmount(
                        e.target.value
                      )
                    }
                    placeholder="20"
                    inputMode="decimal"
                  />

                  <button
                    className="primaryButton"
                    disabled={
                      txBusy ||
                      !withdrawAmount
                    }
                    onClick={
                      withdraw
                    }
                  >
                    {txBusy
                      ? "Processing..."
                      : "Request Withdrawal"}
                  </button>
                </div>

                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        INFORMATION
                      </span>

                      <h3>
                        Withdrawal Wallets
                      </h3>
                    </div>
                  </div>

                  <div className="businessRows">
                    <div>
                      <span>
                        Earning
                      </span>

                      <strong>
                        $
                        {formatUSDT(
                          profile.earningWallet
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Rank
                      </span>

                      <strong>
                        $
                        {formatUSDT(
                          profile.rankWallet
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Royalty
                      </span>

                      <strong>
                        $
                        {formatUSDT(
                          profile.royaltyWallet
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Withdrawn
                      </span>

                      <strong>
                        $
                        {formatUSDT(
                          profile.totalWithdrawn
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              PROFILE
          ================================================= */}
          {section ===
            "profile" && (
            <section className="content">
              <SectionTitle
                eyebrow="ACCOUNT"
                title="My Profile"
                description="Complete profile values read from the ORBI smart contract."
              />

              <div className="profileGrid">
                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        IDENTITY
                      </span>

                      <h3>
                        Account
                      </h3>
                    </div>
                  </div>

                  <div className="profileSummary">
                    <div>
                      <span>
                        User ID
                      </span>

                      <strong>
                        #
                        {profile.id.toString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Wallet
                      </span>

                      <strong className="addressValue">
                        {shortAddress(
                          profile.wallet
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Sponsor ID
                      </span>

                      <strong>
                        #
                        {profile.sponsorId.toString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Status
                      </span>

                      <strong className="greenText">
                        {statusLabel(
                          profile.status
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Rank
                      </span>

                      <strong>
                        R{profile.rank}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Royalty
                      </span>

                      <strong>
                        {profile.royalty}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panelHeader">
                    <div>
                      <span className="panelEyebrow">
                        CONTRACT
                      </span>

                      <h3>
                        Deployed Contract
                      </h3>
                    </div>
                  </div>

                  <div className="contractInfo">
                    <span>
                      ORBIWorld
                    </span>

                    <code>
                      {
                        CONTRACT_ADDRESS
                      }
                    </code>

                    <a
                      href={`${BSC_TESTNET.explorer}/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open on BscScan ↗
                    </a>

                    <span>
                      USDT
                    </span>

                    <code>
                      {
                        USDT_ADDRESS
                      }
                    </code>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              STAKE ACTION
          ================================================= */}
          {(section ===
            "overview" ||
            section ===
              "packages") && (
            <section className="content">
              <div className="panel stakePanel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      STAKING
                    </span>

                    <h3>
                      {profile.status ===
                      UserStatus.ACTIVE
                        ? "Create New Package"
                        : "Activate Account"}
                    </h3>
                  </div>
                </div>

                <div className="stakeForm">
                  <div>
                    <label className="fieldLabel">
                      USDT Amount
                    </label>

                    <input
                      className="input"
                      value={
                        stakeAmount
                      }
                      onChange={(e) =>
                        setStakeAmount(
                          e.target.value
                        )
                      }
                      placeholder="50"
                      inputMode="decimal"
                    />
                  </div>

                  <button
                    className="primaryButton"
                    disabled={
                      txBusy ||
                      !stakeAmount
                    }
                    onClick={
                      profile.status ===
                      UserStatus.ACTIVE
                        ? topUp
                        : activate
                    }
                  >
                    {txBusy
                      ? "Processing..."
                      : profile.status ===
                        UserStatus.ACTIVE
                      ? "Top Up"
                      : "Activate Account"}
                  </button>
                </div>
              </div>
            </section>
          )}

          <footer className="footer">
            <span>
              ORBIWORLD
            </span>

            <span>
              Contract-powered dashboard
            </span>

            <a
              href={`${BSC_TESTNET.explorer}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              Contract ↗
            </a>
          </footer>
        </main>
      </div>
    </>
  );
}

/* =========================================================
   CSS
========================================================= */

const GLOBAL_CSS = `
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #eef2ff;
  color: #111827;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

a {
  color: inherit;
  text-decoration: none;
}

.appShell {
  min-height: 100vh;
  display: flex;
  background: #eef2ff;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 250px;
  padding: 24px 16px;
  background: #111827;
  color: white;
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 5px 10px 24px;
}

.brand img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.brand strong {
  display: block;
  font-size: 20px;
  letter-spacing: .08em;
}

.brand span {
  display: block;
  font-size: 10px;
  letter-spacing: .25em;
  opacity: .6;
}

.walletMini {
  margin: 0 4px 22px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  background: rgba(255,255,255,.04);
}

.walletMini span {
  display: block;
  font-size: 9px;
  letter-spacing: .16em;
  opacity: .55;
  margin-bottom: 5px;
}

.walletMini code {
  font-size: 12px;
  color: #d1d5db;
}

.nav {
  display: grid;
  gap: 5px;
}

.navButton {
  border: 0;
  background: transparent;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border-radius: 10px;
  text-align: left;
  transition: .15s ease;
}

.navButton:hover,
.navButton.selected {
  background: rgba(255,255,255,.08);
  color: white;
}

.navButton.selected {
  box-shadow: inset 3px 0 0 #22c55e;
}

.navIcon {
  width: 22px;
  text-align: center;
  font-weight: 700;
}

.sidebarBottom {
  margin-top: auto;
}

.contractLink {
  display: block;
  padding: 10px 12px;
  font-size: 12px;
  color: #9ca3af;
}

.networkPill {
  margin-top: 5px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(34,197,94,.08);
  color: #86efac;
  font-size: 11px;
}

.main {
  width: calc(100% - 250px);
  margin-left: 250px;
  min-height: 100vh;
}

.header {
  min-height: 86px;
  padding: 18px 32px;
  background: rgba(255,255,255,.88);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 18px;
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(14px);
}

.headerEyebrow,
.eyebrow,
.panelEyebrow {
  display: block;
  font-size: 10px;
  letter-spacing: .17em;
  font-weight: 800;
  color: #6b7280;
}

.header h1 {
  margin: 4px 0 0;
  font-size: 22px;
  line-height: 1.2;
}

.headerActions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.refreshButton,
.textButton {
  border: 0;
  background: transparent;
  color: #374151;
  font-weight: 700;
}

.refreshButton:hover,
.textButton:hover {
  color: #16a34a;
}

.accountChip {
  padding: 9px 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  font-family: monospace;
  font-size: 12px;
}

.onlineDot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  margin-right: 7px;
}

.menuButton {
  display: none;
  border: 0;
  background: transparent;
  font-size: 23px;
}

.content {
  padding: 32px;
  max-width: 1500px;
  margin: auto;
}

.sectionTitle {
  margin-bottom: 24px;
}

.sectionTitle h2 {
  margin: 5px 0 6px;
  font-size: 28px;
}

.sectionTitle p {
  margin: 0;
  color: #6b7280;
  max-width: 720px;
  line-height: 1.6;
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.statCard {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 19px;
  box-shadow: 0 5px 18px rgba(15,23,42,.04);
}

.statLabel {
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.statValue {
  margin-top: 9px;
  font-size: 24px;
  font-weight: 800;
  word-break: break-word;
}

.statSub {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 11px;
}

.overviewGrid,
.businessGrid,
.withdrawGrid,
.profileGrid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}

.panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 5px 18px rgba(15,23,42,.04);
  margin-bottom: 18px;
}

.panelHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
}

.panelHeader h3 {
  margin: 4px 0 0;
  font-size: 18px;
}

.profileSummary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: #e5e7eb;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  border-radius: 13px;
}

.profileSummary > div {
  background: white;
  padding: 14px;
}

.profileSummary span {
  display: block;
  color: #6b7280;
  font-size: 11px;
  margin-bottom: 5px;
}

.profileSummary strong {
  font-size: 14px;
}

.greenText {
  color: #16a34a !important;
}

.packageCard {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.packageTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.packageLabel {
  color: #6b7280;
  font-size: 9px;
  letter-spacing: .14em;
  font-weight: 800;
}

.packageTop h3 {
  margin: 4px 0 0;
}

.statusBadge {
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 9px;
  font-weight: 800;
}

.statusBadge.active {
  background: #dcfce7;
  color: #15803d;
}

.statusBadge.closed {
  background: #fee2e2;
  color: #b91c1c;
}

.packageAmount {
  margin: 20px 0;
  font-size: 31px;
  font-weight: 900;
}

.packageGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.packageGrid div {
  padding: 11px;
  border-radius: 10px;
  background: white;
  border: 1px solid #e5e7eb;
}

.packageGrid span {
  display: block;
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 4px;
}

.packageGrid strong {
  font-size: 12px;
}

.progressBlock {
  margin-top: 18px;
}

.progressHeader {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 11px;
  margin-bottom: 7px;
}

.progressTrack {
  height: 7px;
  background: #e5e7eb;
  border-radius: 99px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: #22c55e;
  border-radius: inherit;
}

.packageFooter {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 13px;
  font-size: 10px;
  color: #6b7280;
}

.packageList {
  display: grid;
  gap: 14px;
  margin-bottom: 28px;
}

.packageToolbar {
  padding: 14px 18px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 13px;
  margin-bottom: 14px;
}

.packageToolbar div {
  display: flex;
  justify-content: space-between;
}

.packageToolbar span {
  color: #6b7280;
  font-size: 12px;
}

.historyHeading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 30px 0 14px;
}

.historyHeading h3 {
  margin: 0;
}

.historyHeading span {
  color: #6b7280;
  font-size: 12px;
}

.businessRows {
  display: grid;
  gap: 1px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.businessRows > div {
  background: white;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.businessRows span {
  color: #6b7280;
  font-size: 12px;
}

.teamMiniList {
  display: grid;
  gap: 8px;
}

.teamMini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 1px solid #e5e7eb;
  border-radius: 11px;
}

.teamMini > div:nth-child(2) {
  flex: 1;
}

.teamMini strong,
.teamMini span {
  display: block;
}

.teamMini strong {
  font-size: 12px;
}

.teamMini span {
  margin-top: 3px;
  font-size: 10px;
  color: #6b7280;
}

.teamMini b {
  font-size: 9px;
  color: #16a34a;
}

.avatar {
  width: 31px;
  height: 31px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #dcfce7;
  color: #15803d;
  font-size: 9px;
  font-weight: 800;
}

.levelGrid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.levelCard {
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
}

.levelCard span {
  display: block;
  color: #6b7280;
  font-size: 10px;
}

.levelCard strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
}

.walletGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.walletBalance {
  padding: 20px;
  border-radius: 15px;
  background: white;
  border: 1px solid #e5e7eb;
}

.walletBalance span {
  display: block;
  color: #6b7280;
  font-size: 11px;
}

.walletBalance strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}

.fieldLabel {
  display: block;
  margin: 13px 0 7px;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  outline: none;
}

.input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,.1);
}

.primaryButton {
  width: 100%;
  min-height: 45px;
  border: 0;
  border-radius: 10px;
  background: #16a34a;
  color: white;
  font-weight: 800;
  margin-top: 15px;
}

.primaryButton:hover {
  background: #15803d;
}

.stakeForm {
  display: grid;
  grid-template-columns: 1fr 220px;
  align-items: end;
  gap: 12px;
}

.stakeForm .primaryButton {
  margin-top: 0;
}

.contractInfo {
  display: grid;
  gap: 10px;
}

.contractInfo code {
  padding: 11px;
  border-radius: 9px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  word-break: break-all;
  font-size: 11px;
}

.contractInfo a {
  color: #16a34a;
  font-weight: 700;
  font-size: 12px;
}

.tableWrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 13px 10px;
  border-bottom: 1px solid #eef2f7;
  white-space: nowrap;
}

th {
  color: #6b7280;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
}

td {
  font-size: 12px;
}

td code {
  font-size: 11px;
}

.statusText {
  font-size: 10px;
  font-weight: 800;
}

.noticeWrap {
  padding: 16px 32px 0;
}

.errorBox,
.infoBox {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.errorBox {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.infoBox {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.emptyState {
  padding: 38px 20px;
  text-align: center;
  border: 1px dashed #d1d5db;
  border-radius: 14px;
  background: #f8fafc;
}

.emptyIcon {
  font-size: 28px;
  color: #9ca3af;
}

.emptyState h3 {
  margin: 10px 0 5px;
}

.emptyState p {
  margin: 0 auto;
  max-width: 500px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.6;
}

.loginPage,
.loadingPage {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #eef2ff;
}

.loginCard {
  width: min(430px, 100%);
  padding: 34px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(15,23,42,.08);
}

.logoBox {
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
}

.logoBox img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loginCard h1 {
  margin: 7px 0 10px;
  font-size: 29px;
}

.loginCard p {
  color: #6b7280;
  line-height: 1.65;
  font-size: 13px;
}

.networkText {
  text-align: center;
  margin-top: 14px;
  color: #9ca3af;
  font-size: 10px;
}

.walletPreview {
  margin: 15px 0;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  font-family: monospace;
  font-size: 12px;
  text-align: center;
}

.fieldHint {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 10px;
}

.loader {
  width: 35px;
  height: 35px;
  border: 3px solid #d1d5db;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

.loadingPage {
  gap: 12px;
  color: #6b7280;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.footer {
  padding: 25px 32px 35px;
  color: #9ca3af;
  font-size: 10px;
  display: flex;
  gap: 15px;
}

.footer a {
  color: #16a34a;
}

.mobileOverlay {
  display: none;
}

@media (max-width: 1050px) {
  .statsGrid {
    grid-template-columns: repeat(2, 1fr);
  }

  .overviewGrid,
  .businessGrid,
  .withdrawGrid,
  .profileGrid {
    grid-template-columns: 1fr;
  }

  .packageGrid {
    grid-template-columns: repeat(2, 1fr);
  }

  .levelGrid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 780px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform .2s ease;
  }

  .sidebar.sidebarOpen {
    transform: translateX(0);
  }

  .mobileOverlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.35);
    z-index: 40;
  }

  .main {
    width: 100%;
    margin-left: 0;
  }

  .menuButton {
    display: block;
  }

  .header {
    padding: 15px 18px;
  }

  .headerActions {
    gap: 5px;
  }

  .refreshButton {
    display: none;
  }

  .accountChip {
    font-size: 10px;
  }

  .content {
    padding: 20px 15px;
  }

  .noticeWrap {
    padding: 12px 15px 0;
  }

  .sectionTitle h2 {
    font-size: 23px;
  }

  .statsGrid {
    grid-template-columns: 1fr 1fr;
  }

  .walletGrid {
    grid-template-columns: 1fr;
  }

  .stakeForm {
    grid-template-columns: 1fr;
  }

  .levelGrid {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer {
    padding: 20px 15px;
  }
}

@media (max-width: 500px) {
  .statsGrid {
    grid-template-columns: 1fr;
  }

  .packageGrid {
    grid-template-columns: 1fr 1fr;
  }

  .packageAmount {
    font-size: 27px;
  }

  .profileSummary {
    grid-template-columns: 1fr;
  }

  .header h1 {
    font-size: 17px;
  }

  .headerEyebrow {
    font-size: 8px;
  }

  .loginCard {
    padding: 25px 20px;
  }
}
`;