import { useSyncExternalStore } from 'react';
import { indexCooperationPayments } from './coopPayProgress';
import { campaignHasFinance, INITIAL_MOCK_STATE, nextId } from './mockSeed';
import type {
  MockState,
  PaymentStatus,
  PrototypeCampaign,
  PrototypeCooperation,
  PrototypeCreator,
  PrototypePayment,
} from './mockTypes';
import { MOCK_STORAGE_KEY } from './mockTypes';

type Listener = () => void;

let state: MockState = loadState();
const listeners = new Set<Listener>();

function loadState(): MockState {
  if (typeof window === 'undefined') return structuredClone(INITIAL_MOCK_STATE);
  try {
    const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return structuredClone(INITIAL_MOCK_STATE);
    const parsed = JSON.parse(raw) as MockState;
    if (!parsed?.campaigns || !parsed?.creators) return structuredClone(INITIAL_MOCK_STATE);
    return parsed;
  } catch {
    return structuredClone(INITIAL_MOCK_STATE);
  }
}

function persist() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function setState(partial: Partial<MockState> | ((prev: MockState) => MockState)) {
  state = typeof partial === 'function' ? partial(state) : { ...state, ...partial };
  emit();
}

export function getMockState() {
  return state;
}

export function subscribeMock(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMockStore() {
  return useSyncExternalStore(subscribeMock, getMockState, getMockState);
}

export function resetMockStore() {
  state = structuredClone(INITIAL_MOCK_STATE);
  emit();
}

export function upsertCampaign(campaign: PrototypeCampaign) {
  setState((prev) => {
    const exists = prev.campaigns.some((c) => c.id === campaign.id);
    return {
      ...prev,
      campaigns: exists
        ? prev.campaigns.map((c) => (c.id === campaign.id ? campaign : c))
        : [campaign, ...prev.campaigns],
    };
  });
}

export function createCampaignId(status: PrototypeCampaign['status']) {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = String(now.getTime()).slice(-3);
  return status === 'draft'
    ? `JM-DRAFT-${m}${d}${suffix}`
    : `JM-${now.getFullYear()}-${m}${d}${suffix}`;
}

export function addCreator(input: Omit<PrototypeCreator, 'id' | 'createdAt'> & { id?: string }) {
  const creator: PrototypeCreator = {
    ...input,
    id: input.id || nextId('cr', state.creators.length),
    createdAt: new Date().toISOString(),
  };
  setState((prev) => ({ ...prev, creators: [creator, ...prev.creators] }));
  return creator;
}

export function addCooperation(
  input: Omit<PrototypeCooperation, 'id' | 'createdAt'> & { id?: string },
) {
  const coop: PrototypeCooperation = {
    ...input,
    id: input.id || nextId('co', state.cooperations.length),
    createdAt: new Date().toISOString(),
  };
  setState((prev) => ({ ...prev, cooperations: [coop, ...prev.cooperations] }));
  return coop;
}

export function addPayment(input: Omit<PrototypePayment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = new Date().toISOString();
  const payment: PrototypePayment = {
    ...input,
    id: input.id || nextId('pr', state.payments.length),
    createdAt: now,
    updatedAt: now,
  };
  setState((prev) => ({ ...prev, payments: [payment, ...prev.payments] }));
  return payment;
}

export function updatePaymentStatus(id: string, status: PaymentStatus) {
  setState((prev) => ({
    ...prev,
    payments: prev.payments.map((p) =>
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p,
    ),
  }));
}

export function paymentRemain(coop: PrototypeCooperation, payments: PrototypePayment[]) {
  return indexCooperationPayments(payments)(coop).remain;
}

export function campaignFinanceFlag(campaignId: string) {
  return campaignHasFinance(campaignId, state.cooperations, state.payments);
}
