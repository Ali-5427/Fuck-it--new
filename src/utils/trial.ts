import { User } from '../types';

export function getTrialDaysRemaining(user: User): number {
  if (!user.trialEndsAt) return 0;
  const trialDate = new Date(user.trialEndsAt);
  const now = new Date();
  const diffMs = trialDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isTrialActive(user: User): boolean {
  if (!user.trialEndsAt) return false;
  const trialDate = new Date(user.trialEndsAt);
  return Date.now() < trialDate.getTime();
}
