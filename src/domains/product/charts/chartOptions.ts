import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts/charts';
import type { GridComponentOption, LegendComponentOption, TooltipComponentOption } from 'echarts/components';
import type { ComposeOption } from 'echarts/core';
import { CHART_COLORS } from '../mockTypes';

export type DashboardChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption
>;

const palette = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.muted,
  CHART_COLORS.danger,
];

export function baseChartOption(partial: DashboardChartOption): DashboardChartOption {
  return {
    color: palette,
    textStyle: { color: '#475467', fontFamily: 'inherit' },
    grid: { left: 48, right: 16, top: 32, bottom: 32, containLabel: true },
    tooltip: { trigger: 'axis' },
    ...partial,
  };
}

export function moneyTooltip(value: number, currency = 'USD') {
  return `${currency} ${Number(value || 0).toLocaleString('en-US')}`;
}
