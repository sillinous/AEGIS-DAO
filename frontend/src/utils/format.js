// Formatting utilities for AEGIS DAO frontend

export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatNumber(value, decimals = 2) {
  const num = Number(value);
  if (isNaN(num)) return '0';

  if (num >= 1_000_000) return (num / 1_000_000).toFixed(decimals) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(decimals) + 'K';
  return num.toFixed(decimals);
}

export function formatTokenAmount(value, decimals = 2) {
  const num = Number(value);
  if (isNaN(num)) return '0';
  if (num === 0) return '0';
  if (num < 0.01) return '< 0.01';
  return formatNumber(value, decimals);
}

export function blocksToTime(blocks, blockTime = 12) {
  const seconds = blocks * blockTime;
  return formatDuration(seconds);
}

export function formatDuration(seconds) {
  if (seconds <= 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

export function getExplorerUrl(baseUrl, type, value) {
  if (!baseUrl) return null;
  const paths = { tx: 'tx', address: 'address', block: 'block', token: 'token' };
  return `${baseUrl}/${paths[type] || type}/${value}`;
}

export function parseProposalDescription(description) {
  const lines = description.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim();
  const body = lines.slice(1).join('\n').trim();
  return { title: title || 'Untitled Proposal', body };
}
