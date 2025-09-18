import { useMemo } from "react";

interface TrendDataPoint {
  day: string;
  value: number;
}

interface KpiTrendProps {
  data: TrendDataPoint[];
  label: string;
  prefix?: string;
  suffix?: string;
}

const KpiTrend = ({ data, label, prefix = "", suffix = "" }: KpiTrendProps) => {
  const { pathData, average, minValue, maxValue } = useMemo(() => {
    if (data.length === 0) {
      return { pathData: "", average: 0, minValue: 0, maxValue: 0 };
    }

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    // SVG dimensions
    const width = 60;
    const height = 20;
    const padding = 2;

    // Scale values to fit in SVG
    const range = max - min || 1; // Avoid division by zero
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((point.value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    // Create path data for the sparkline
    const pathData = data.length > 1 ? `M ${points.split(' ').join(' L ')}` : '';

    return {
      pathData,
      average: Math.round(avg),
      minValue: min,
      maxValue: max
    };
  }, [data]);

  const trendColor = data.length >= 2 && data[data.length - 1].value > data[0].value 
    ? "#16a34a" // green for upward trend
    : "#dc2626"; // red for downward trend

  return (
    <div className="flex items-center justify-between p-3 border border-hostsuite-primary/20 rounded-lg bg-hostsuite-light/10">
      <div>
        <p className="text-sm font-medium text-hostsuite-primary">{label}</p>
        <p className="text-lg font-bold text-hostsuite-text">
          {prefix}{average}{suffix}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <svg 
          width="60" 
          height="20" 
          className="overflow-visible"
          aria-hidden="true"
        >
          {data.length > 1 && (
            <>
              {/* Background grid lines */}
              <defs>
                <pattern id={`grid-${label.replace(/\s/g, '-')}`} width="10" height="4" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 4" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="60" height="20" fill={`url(#grid-${label.replace(/\s/g, '-')})`} />
              
              {/* Sparkline path */}
              <path
                d={pathData}
                fill="none"
                stroke={trendColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {data.map((point, index) => {
                const x = (index / (data.length - 1)) * 56 + 2;
                const y = 18 - ((point.value - minValue) / (maxValue - minValue || 1)) * 16 + 2;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill={trendColor}
                    className="opacity-70"
                  />
                );
              })}
            </>
          )}
          
          {/* Fallback for single data point */}
          {data.length === 1 && (
            <circle
              cx="30"
              cy="10"
              r="2"
              fill="#6b7280"
            />
          )}
        </svg>
        
        {/* Trend indicator */}
        <div className="text-xs text-hostsuite-text/60">
          7g
        </div>
      </div>
    </div>
  );
};

export default KpiTrend;