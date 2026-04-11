export default function GlowBorder({ children, style = {}, className = "" }) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 0 0 1px rgba(125, 211, 252, 0.15), 0 0 24px rgba(125, 211, 252, 0.1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

