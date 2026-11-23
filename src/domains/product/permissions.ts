import type { PrototypeRole } from './prototypeNavigation';
import { ROLE_CURRENT_USER } from './mockTypes';
import type {
  PrototypeCampaign,
  PrototypeCooperation,
  PrototypeCreator,
  PrototypePayment,
} from './mockTypes';
import { campaignHasFinance } from './mockSeed';

export function canCreateCampaign(role: PrototypeRole) {
  return ['architecture', 'business', 'owner', 'executive'].includes(role);
}

export function canCreateCreator(role: PrototypeRole) {
  return ['architecture', 'owner', 'operator', 'executive'].includes(role);
}

export function canCreateCooperation(role: PrototypeRole) {
  return ['architecture', 'owner', 'operator', 'executive'].includes(role);
}

export function canApplyPayment(role: PrototypeRole) {
  return ['architecture', 'owner', 'operator', 'executive'].includes(role);
}

export function canManageCampaign(role: PrototypeRole, campaign?: PrototypeCampaign) {
  if (['architecture', 'business', 'executive'].includes(role)) return true;
  if (role === 'owner' || role === 'operator') {
    return Boolean(campaign && campaign.projectOwner === ROLE_CURRENT_USER[role]);
  }
  return false;
}

export function canExecCampaign(role: PrototypeRole, campaign?: PrototypeCampaign) {
  if (!campaign || campaign.status !== 'active') return false;
  if (['architecture', 'business', 'executive'].includes(role)) return true;
  const me = ROLE_CURRENT_USER[role];
  if (role === 'operator' || role === 'owner') {
    return campaign.operators.includes(me) || campaign.projectOwner === me;
  }
  return false;
}

export function campaignsForRole(
  campaigns: PrototypeCampaign[],
  role: PrototypeRole,
  cooperations: PrototypeCooperation[],
  payments: PrototypePayment[],
) {
  const me = ROLE_CURRENT_USER[role];
  if (role === 'operator') {
    return campaigns.filter(
      (c) =>
        c.status === 'active' && (c.operators.includes(me) || c.projectOwner === me),
    );
  }
  if (role === 'owner') {
    return campaigns.filter((c) => c.projectOwner === me);
  }
  if (role === 'finance') {
    return campaigns.filter((c) => campaignHasFinance(c.id, cooperations, payments));
  }
  if (role === 'business') {
    return campaigns.filter((c) => c.businessOwner === me);
  }
  return campaigns;
}

export function cooperationsForRole(
  cooperations: PrototypeCooperation[],
  campaigns: PrototypeCampaign[],
  role: PrototypeRole,
  payments: PrototypePayment[],
) {
  const visibleCampaignIds = new Set(
    campaignsForRole(campaigns, role, cooperations, payments).map((c) => c.id),
  );
  if (role === 'operator') {
    const me = ROLE_CURRENT_USER[role];
    return cooperations.filter(
      (c) => visibleCampaignIds.has(c.campaignId) && c.operator === me,
    );
  }
  if (role === 'architecture' || role === 'executive') return cooperations;
  return cooperations.filter((c) => visibleCampaignIds.has(c.campaignId));
}

export function paymentsForRole(
  payments: PrototypePayment[],
  role: PrototypeRole,
  campaigns: PrototypeCampaign[] = [],
) {
  if (role === 'finance' || role === 'executive' || role === 'architecture') return payments;
  if (role === 'operator') {
    const me = ROLE_CURRENT_USER[role];
    return payments.filter((p) => p.operator === me);
  }
  if (role === 'owner') {
    const me = ROLE_CURRENT_USER[role];
    const campaignIds = new Set(
      campaigns.filter((c) => c.projectOwner === me).map((c) => c.id),
    );
    return payments.filter((p) => campaignIds.has(p.campaignId));
  }
  if (role === 'business') {
    const me = ROLE_CURRENT_USER[role];
    const campaignIds = new Set(
      campaigns.filter((c) => c.businessOwner === me).map((c) => c.id),
    );
    return payments.filter((p) => campaignIds.has(p.campaignId));
  }
  return [];
}

export function creatorsForRole(creators: PrototypeCreator[], role: PrototypeRole) {
  if (role === 'architecture' || role === 'executive' || role === 'finance') return creators;
  if (role === 'operator' || role === 'owner') {
    const me = ROLE_CURRENT_USER[role];
    return creators.filter((c) => c.createdBy === me);
  }
  return creators;
}

export function canSeePayoutAccount(role: PrototypeRole, operatorName: string) {
  if (role === 'finance' || role === 'executive' || role === 'architecture') return true;
  return ROLE_CURRENT_USER[role] === operatorName;
}

export function maskAccount(account?: string) {
  if (!account) return '-';
  if (account.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, account.length - 4))}${account.slice(-4)}`;
}

export function canReviewPayment(role: PrototypeRole) {
  return role === 'finance' || role === 'executive' || role === 'architecture';
}
