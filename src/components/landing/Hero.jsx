import Logo from "../ui/Logo";

export default function Hero() {
  return (
    <>
      <div
        className="anim-fade-in delay-1"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-3xl)",
        }}
      >
        <Logo />
      </div>

      <p className="type-label anim-fade-up delay-2" style={{ marginBottom: "var(--space-lg)" }}>
        Authentication Protocol
      </p>

      <h1
        className="anim-text-reveal delay-3"
        style={{
          fontSize: "clamp(2.25rem, 5vw, 3rem)",
          fontWeight: 300,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          color: "var(--text-primary)",
          marginBottom: "var(--space-2xl)",
        }}
      >
        Who are you,
        <br />
        <span style={{ fontWeight: 700, fontStyle: "italic" }}>agent?</span>
      </h1>
    </>
  );
}

