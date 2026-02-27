import { ethers } from "ethers";

export const PROPOSAL_STATES = [
  { label: "Pending", color: "#94a3b8" },
  { label: "Active", color: "#3b82f6" },
  { label: "Canceled", color: "#6b7280" },
  { label: "Defeated", color: "#ef4444" },
  { label: "Succeeded", color: "#22c55e" },
  { label: "Queued", color: "#f59e0b" },
  { label: "Expired", color: "#6b7280" },
  { label: "Executed", color: "#8b5cf6" },
];

export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokens(value, decimals = 18, precision = 2) {
  if (!value) return "0";
  const formatted = ethers.formatUnits(value, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return "0";
  if (num < 0.01) return "<0.01";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

export function formatDuration(seconds) {
  const s = Number(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function formatTimestamp(timestamp) {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getProposalState(stateNum) {
  return PROPOSAL_STATES[stateNum] || { label: "Unknown", color: "#6b7280" };
}

export function descriptionHash(description) {
  return ethers.id(description);
}
