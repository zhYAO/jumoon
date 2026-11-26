import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { DashboardChartOption } from './chartOptions';

function ChartUnavailable() {
  return <span role="status">图表暂时无法加载</span>;
}

// A failed chunk must not take down the surrounding metrics and actions.
const ChartRenderer = lazy(() =>
  import('./ChartRenderer').catch(() => ({ default: ChartUnavailable })),
);

type ChartProps = {
  option: DashboardChartOption;
  height?: number;
};

export function DemoChart({ option, height = 260 }: ChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setShowChart(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        setShowChart(true);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} style={{ height }}>
      {showChart && (
        <Suspense fallback={<span role="status">图表加载中…</span>}>
          <ChartRenderer option={option} />
        </Suspense>
      )}
    </div>
  );
}
