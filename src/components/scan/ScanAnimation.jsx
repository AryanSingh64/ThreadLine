"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/interfaces-progress";
import ScanMessages from "./ScanMessages";

export default function ScanAnimation({ running, messages, progress = 0 }) {
  if (!running) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(3, 3, 8, 0.86)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ─── Rotating Wireframe Globe ─── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        style={{
          width: "28px",
          height: "28px",
          opacity: 0.5,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "100%", height: "100%" }}
        >
          <circle cx="12" cy="12" r="10" />
          <ellipse cx="12" cy="12" rx="4" ry="10" />
          <path d="M2 12h20" />
          <path d="M4.5 7h15" />
          <path d="M4.5 17h15" />
        </svg>
      </motion.div>

      {/* ─── Title ─── */}
      <p
        className="type-label"
        style={{
          marginTop: "14px",
          color: "var(--text-secondary)",
          letterSpacing: "0.12em",
        }}
      >
        Scanning
      </p>

      {/* ─── Progress Bar ─── */}
      <div
        style={{
          width: "min(240px, 65vw)",
          marginTop: "12px",
        }}
      >
        <Progress value={progress} />
      </div>
      <p
        className="type-micro"
        style={{
          marginTop: "4px",
          color: "var(--text-muted)",
        }}
      >
        {progress}%
      </p>

      {/* ─── Status Messages ─── */}
      <div style={{ marginTop: "14px" }}>
        <ScanMessages messages={messages} />
      </div>
    </motion.div>
  );
}
