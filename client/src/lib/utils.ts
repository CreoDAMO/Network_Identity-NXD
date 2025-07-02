import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string, decimals = 2): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

export function formatCurrency(num: number | string, currency = 'ETH'): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return `${formatNumber(number)} ${currency}`;
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function calculateStakingRewards(
  stakedAmount: string,
  apy: string,
  days: number = 30
): string {
  const amount = parseFloat(stakedAmount);
  const apyNumber = parseFloat(apy) / 100;
  const dailyRate = apyNumber / 365;
  const rewards = amount * dailyRate * days;
  return rewards.toFixed(6);
}

export function getStakingTier(stakedAmount: string): {
  tier: string;
  color: string;
  bonus: string;
} {
  const amount = parseFloat(stakedAmount);
  
  if (amount >= 100000) {
    return { tier: 'Gold', color: 'text-solar-orange', bonus: '+5% Bonus' };
  } else if (amount >= 10000) {
    return { tier: 'Silver', color: 'text-nebula-blue', bonus: '+2% Bonus' };
  } else {
    return { tier: 'Bronze', color: 'text-cosmic-purple', bonus: 'Base APY' };
  }
}

export function validateDomainName(domain: string): {
  isValid: boolean;
  error?: string;
} {
  if (!domain) {
    return { isValid: false, error: 'Domain name is required' };
  }
  
  if (domain.length < 3) {
    return { isValid: false, error: 'Domain must be at least 3 characters' };
  }
  
  if (domain.length > 63) {
    return { isValid: false, error: 'Domain must be less than 63 characters' };
  }
  
  if (!/^[a-zA-Z0-9-]+$/.test(domain)) {
    return { isValid: false, error: 'Domain can only contain letters, numbers, and hyphens' };
  }
  
  if (domain.startsWith('-') || domain.endsWith('-')) {
    return { isValid: false, error: 'Domain cannot start or end with a hyphen' };
  }
  
  return { isValid: true };
}

export function calculateVotingPower(nxdStaked: string, multiplier = 1): string {
  const staked = parseFloat(nxdStaked);
  return (staked * multiplier).toString();
}

export function formatVotingPercentage(
  votesFor: string,
  votesAgainst: string
): { forPercentage: number; againstPercentage: number; totalVotes: string } {
  const forVotes = parseFloat(votesFor);
  const againstVotes = parseFloat(votesAgainst);
  const total = forVotes + againstVotes;
  
  if (total === 0) {
    return { forPercentage: 0, againstPercentage: 0, totalVotes: '0' };
  }
  
  return {
    forPercentage: Math.round((forVotes / total) * 100),
    againstPercentage: Math.round((againstVotes / total) * 100),
    totalVotes: total.toString(),
  };
}

export function isValidTLD(tld: string): boolean {
  const validTlds = ['nxd', 'web3', 'dao', 'defi'];
  return validTlds.includes(tld.toLowerCase());
}

export function generateDomainFromSuggestion(baseName: string, suggestions: string[]): string[] {
  return suggestions.map(suffix => `${baseName}${suffix}`);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
