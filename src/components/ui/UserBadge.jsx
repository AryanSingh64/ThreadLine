import Image from "next/image";

export default function UserBadge({ name, archetype }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "999px",
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <Image
          src={`/avatars/${archetype}.png`}
          alt={name || "Agent"}
          width={24}
          height={24}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <span
        style={{
          fontSize: "0.6875rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
        }}
      >
        {name || "Agent"}
      </span>
    </div>
  );
}

