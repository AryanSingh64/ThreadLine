import GlassCard from "../ui/GlassCard";
import NotFoundPage from "../ui/page-not-found";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildMapUrl(lat, lon) {
  const delta = 0.6;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function GeoMapPanel({ geoData }) {
  const lat = toNumber(geoData?.lat);
  const lon = toNumber(geoData?.lon);
  const hasCoords = lat !== null && lon !== null;

  return (
    <GlassCard
      style={{
        padding: "14px",
        background:
          "linear-gradient(180deg, rgba(16, 24, 40, 0.24) 0%, rgba(12, 14, 20, 0.2) 100%)",
        border: "1px solid rgba(52, 211, 153, 0.24)",
      }}
    >
      <p className="type-label" style={{ marginBottom: "10px" }}>
        Geolocation
      </p>
      {hasCoords ? (
        <iframe
          title="Investigation geolocation map"
          src={buildMapUrl(lat, lon)}
          style={{
            width: "100%",
            height: "220px",
            border: "1px solid rgba(52, 211, 153, 0.25)",
            borderRadius: "var(--radius-sm)",
            background: "#111",
          }}
          loading="lazy"
        />
      ) : (
        <div style={{ height: "220px", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
          <NotFoundPage
            title="Map Unavailable"
            code="N/A"
            description="No coordinates were found for this target yet. Try Deep mode or additional sources."
            fullscreen={false}
            hideActions
            showDecorations={false}
          />
        </div>
      )}

      <div style={{ marginTop: "10px", display: "grid", gap: "4px" }}>
        <p className="type-caption" style={{ color: "var(--text-secondary)" }}>
          {geoData?.city || "Unknown city"} • {geoData?.country || "Unknown country"}
        </p>
        <p className="type-caption" style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}>
          ISP: {geoData?.isp || "Unknown"}
        </p>
      </div>
    </GlassCard>
  );
}
