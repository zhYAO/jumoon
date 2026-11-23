import { buildAccessMap } from '@/domains/iam/utils/accessFactory';
import type { InitialStateType } from './app';

export default function access(initialState: InitialStateType) {
  return buildAccessMap(initialState?.permissionInfo);
}
