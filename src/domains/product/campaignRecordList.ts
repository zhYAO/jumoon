import type { PrototypeCampaign, PrototypeCooperation } from './mockTypes';

type CampaignRecord = Pick<
  PrototypeCooperation,
  'campaignId' | 'creatorId' | 'creatorName' | 'operator'
>;

export function textOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)), (value) => ({ value, label: value }));
}

/** 用已按角色过滤的合作或付款记录生成列表和筛选项。 */
export function buildCampaignRecordList<T extends CampaignRecord>(
  records: T[],
  campaigns: PrototypeCampaign[],
) {
  const campaignById = new Map(campaigns.map((c) => [c.id, c]));
  const rows = records.map((record) => {
    const campaign = campaignById.get(record.campaignId);
    return {
      ...record,
      campaignName: campaign?.name || record.campaignId,
      brand: campaign?.clientBrand || '',
    };
  });
  const campaignIds = new Set(records.map((r) => r.campaignId));
  const creators = new Map(records.map((r) => [r.creatorId, r.creatorName]));
  return {
    rows,
    campaignOptions: campaigns
      .filter((c) => campaignIds.has(c.id))
      .map((c) => ({ value: c.id, label: c.name })),
    creatorOptions: Array.from(creators, ([value, label]) => ({ value, label })),
    brandOptions: textOptions(rows.map((r) => r.brand)),
    operatorOptions: textOptions(rows.map((r) => r.operator)),
  };
}
