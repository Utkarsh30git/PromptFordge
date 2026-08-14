

const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 24;

const formatShortDate = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const TrendChart = ({ data, color = "var(--teal)", valueFormatter }) => {
  if (!data || data.length === 0) {
    return <div className="trend-chart-empty">No data for this range yet</div>;
  }

  if (data.length === 1) {
    const only = data[0];
    return (
      <div className="trend-chart-empty">
        Only one data point so far —{" "}
        {valueFormatter ? valueFormatter(only.value) : only.value} on{" "}
        {formatShortDate(only.date)}
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const innerWidth = WIDTH - PADDING * 2;
  const innerHeight = HEIGHT - PADDING * 2;

  const points = data.map((d, i) => {
    const x = PADDING + (i / (data.length - 1)) * innerWidth;
    const y = PADDING + innerHeight - ((d.value - minValue) / range) * innerHeight;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
    HEIGHT - PADDING
  ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(HEIGHT - PADDING).toFixed(1)} Z`;

  const gradientId = `trend-gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  const firstLabel = formatShortDate(data[0].date);
  const lastLabel = formatShortDate(data[data.length - 1].date);

  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="trend-chart-svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
        ))}
      </svg>

      <div className="trend-chart-axis">
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
};

export default TrendChart;
