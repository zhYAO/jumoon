export type {
  CampaignBudgetType,
  CampaignStatus,
  PrototypeCampaign,
} from './mockTypes';
export {
  BUSINESS_USERS,
  COMPANY_USERS,
  OPERATOR_USERS,
  ROLE_CURRENT_USER,
} from './mockTypes';
export { canCreateCampaign } from './permissions';
export { createCampaignId as nextCampaignId, upsertCampaign, useMockStore } from './mockStore';

import { getMockState } from './mockStore';
import type { PrototypeRole } from './prototypeNavigation';
import { campaignsForRole as filterCampaigns } from './permissions';
import type { PrototypeCampaign } from './mockTypes';

export function campaignsForRole(campaigns: PrototypeCampaign[], role: PrototypeRole) {
  const { cooperations, payments } = getMockState();
  return filterCampaigns(campaigns, role, cooperations, payments);
}

export function loadPrototypeCampaigns() {
  return getMockState().campaigns;
}

export function savePrototypeCampaigns(_campaigns: PrototypeCampaign[]) {
  // no-op: use upsertCampaign / useMockStore
}
