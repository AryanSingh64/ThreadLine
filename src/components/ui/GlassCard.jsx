export default function GlassCard({ children, className = "", style = {}, ...rest }) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "var(--radius-lg)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

