import GlassCard from "../ui/GlassCard";

function meterColor(score) {
  if (score <= 30) return "var(--accent-signal)";
  if (score <= 60) return "var(--accent-warn)";
  if (score <= 80) return "var(--accent-ember)";
  return "#ff224f";
}

export default function ThreatMeter({ score }) {
  const value = Math.max(0, Math.min(100, score?.score || 0));
  const color = meterColor(value);

  // SVG Gauge Calculations
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Offset formula calculates the exact empty space to "hide" part of the stroke
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <GlassCard
      style={{
        padding: "18px",
        textAlign: "center",
        background: "linear-gradient(180deg, rgba(16, 24, 40, 0.28) 0%, rgba(12, 14, 20, 0.24) 100%)",
        border: "1px solid rgba(125, 211, 252, 0.2)",
      }}
    >
      <p className="type-label" style={{ marginBottom: "12px" }}>
        Threat Meter
      </p>
      
      <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, margin: "0 auto" }}>
        <svg
          width={size}
          height={size}
          style={{ 
            transform: "rotate(-90deg)", // Starts gauge from the top
            filter: `drop-shadow(0 0 10px ${color}33)`
          }}
        >
          {/* Background Track */}
          <circle
            stroke="rgba(255, 255, 255, 0.08)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Animated Value Track */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset,
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.6s ease"
            }}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>

        {/* Center UI Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            color: "var(--text-primary)",
            fontSize: "1.4rem",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            textShadow: `0 0 12px ${color}66`,
          }}
        >
          {Math.round(value)}
        </div>
      </div>

      <p className="type-body" style={{ marginTop: "12px", color, fontWeight: 500, letterSpacing: "0.03em" }}>
        {score?.label || "No score yet"}
      </p>
    </GlassCard>
  );
}
