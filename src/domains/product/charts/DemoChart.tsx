import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS } from '../mockTypes';

export const chartPalette = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.muted,
  CHART_COLORS.danger,
];

export function moneyTooltip(value: number, currency = 'USD') {
  return `${currency} ${Number(value || 0).toLocaleString('en-US')}`;
}

export function baseChartOption(partial: EChartsOption): EChartsOption {
  return {
    color: chartPalette,
    textStyle: { color: '#475467', fontFamily: 'inherit' },
    grid: { left: 48, right: 16, top: 32, bottom: 32, containLabel: true },
    tooltip: { trigger: 'axis' },
    ...partial,
  };
}

type ChartProps = {
  option: EChartsOption;
  height?: number;
  empty?: boolean;
};

export function DemoChart({ option, height = 260, empty }: ChartProps) {
  if (empty) return null;
  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  );
}
