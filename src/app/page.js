"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ARCHETYPES = [
  { id: "shadow", name: "Shadow", img: "/avatars/shadow.png" },
  { id: "sentinel", name: "Sentinel", img: "/avatars/sentinel.png" },
  { id: "phantom", name: "Phantom", img: "/avatars/phantom.png" },
  { id: "oracle", name: "Oracle", img: "/avatars/oracle.png" },
  { id: "warden", name: "Warden", img: "/avatars/warden.png" },
];

export default function LandingPage() {
  const router = useRouter();
  const [agentName, setAgentName] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    // Check if agent already registered
    const savedName = localStorage.getItem("threadline_agent_name");
    const savedArchetype = localStorage.getItem("threadline_archetype");
    if (savedName && savedArchetype) {
      router.push("/investigate");
      return;
    }
  }, [router]);

  const handleInitiate = () => {
    if (!agentName.trim() || !selectedArchetype) return;

    // Save to localStorage
    localStorage.setItem("threadline_agent_name", JSON.stringify(agentName.trim()));
    localStorage.setItem("threadline_archetype", JSON.stringify(selectedArchetype));

    // Transition animation
    setEntering(true);
    setTimeout(() => {
      router.push("/investigate");
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInitiate();
    }
  };

  return (
    <div
      className="full-center"
      style={{
        position: "relative",
        opacity: entering ? 0 : 1,
        transition: "opacity 500ms ease",
      }}
    >
      {/* ─── Background Grid Effect ─── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── Radial Glow ─── */}
      <div
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="page-container text-center"
        style={{ position: "relative", zIndex: 1, padding: "0 24px" }}
      >
        {/* ─── Brand ─── */}
        <div
          className="anim-fade-in delay-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "var(--space-3xl)",
          }}
        >
          <div
            style={{
              width: "3px",
              height: "20px",
              background: "var(--text-primary)",
              borderRadius: "2px",
            }}
          />
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
            }}
          >
            ThreadLine
          </span>
        </div>

        {/* ─── Auth Protocol Label ─── */}
        <p
          className="type-label anim-fade-up delay-2"
          style={{ marginBottom: "var(--space-lg)" }}
        >
          Authentication Protocol
        </p>

        {/* ─── Hero Text ─── */}
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
          <span
            style={{
              fontWeight: 700,
              fontStyle: "italic",
            }}
          >
            agent?
          </span>
        </h1>

        {/* ─── Identity Input ─── */}
        <div className="anim-fade-up delay-5" style={{ marginBottom: "var(--space-xl)" }}>
          <p
            className="type-label"
            style={{ marginBottom: "var(--space-md)" }}
          >
            Identity Designation
          </p>
          <div
            style={{
              maxWidth: "420px",
              margin: "0 auto",
              borderBottom: "1px solid var(--border-hover)",
              paddingBottom: "var(--space-sm)",
            }}
          >
            <input
              id="agent-name-input"
              type="text"
              placeholder="Search key..."
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                fontWeight: 300,
                color: "var(--text-primary)",
                textAlign: "center",
                letterSpacing: "0.02em",
              }}
            />
          </div>
        </div>

        {/* ─── Archetype Selector ─── */}
        <div className="anim-fade-up delay-6" style={{ marginBottom: "var(--space-xl)" }}>
          <p
            className="type-label"
            style={{ marginBottom: "var(--space-md)" }}
          >
            Archetype Signature
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-sm)",
            }}
          >
            {ARCHETYPES.map((arch, i) => (
              <div
                key={arch.id}
                className={`avatar-item avatar-stagger-${i + 1} anim-fade-in ${
                  selectedArchetype === arch.id ? "selected" : ""
                }`}
                onClick={() => setSelectedArchetype(arch.id)}
                title={arch.name}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedArchetype(arch.id);
                  }
                }}
              >
                <Image
                  src={arch.img}
                  alt={arch.name}
                  width={64}
                  height={64}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ─── CTA Button ─── */}
        <div
          className="anim-fade-up delay-7"
          style={{ maxWidth: "420px", margin: "0 auto var(--space-xl)" }}
        >
          <button
            id="initiate-btn"
            className="btn-cta"
            onClick={handleInitiate}
            disabled={!agentName.trim() || !selectedArchetype}
            style={{
              opacity: agentName.trim() && selectedArchetype ? 1 : 0.3,
              cursor:
                agentName.trim() && selectedArchetype
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            Initiate Connection
            <ArrowRight size={16} />
          </button>
        </div>

        {/* ─── Footer ─── */}
        <div
          className="anim-fade-in delay-8"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "420px",
            margin: "0 auto",
          }}
        >
          <span className="type-caption" style={{ color: "var(--text-muted)" }}>
            Secure Node
          </span>
          <div style={{ display: "flex", gap: "var(--space-lg)" }}>
            <span className="type-caption" style={{ color: "var(--text-muted)" }}>
              Privacy
            </span>
            <span className="type-caption" style={{ color: "var(--text-muted)" }}>
              Terms
            </span>
          </div>
        </div>
      </div>

      {/* ─── Bottom Status Bar ─── */}
      <div
        className="anim-fade-in delay-8"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "32px",
          textAlign: "right",
          zIndex: 1,
        }}
      >
        <p className="type-micro" style={{ marginBottom: "2px" }}>
          System Status: Operational
        </p>
        <p className="type-micro">
          Encryption Standard: AES-256-GCM
        </p>
      </div>
    </div>
  );
}
