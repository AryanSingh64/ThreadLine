"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const RANDOM_CHARS = "_!X$0-+*#";

function getRandomChar(prevChar) {
  let char;
  do {
    char = RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
  } while (char === prevChar);
  return char;
}

export function SpecialText({
  children,
  speed = 22,
  delay = 0,
  className = "",
  inView: triggerOnView = false,
  once = true,
}) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once, margin: "-60px" });
  const shouldAnimate = triggerOnView ? isInView : true;

  const text = children;

  const [hasStarted, setHasStarted] = useState(!triggerOnView && delay <= 0);
  const [displayText, setDisplayText] = useState("\u00A0".repeat(text.length));
  const [currentPhase, setCurrentPhase] = useState("phase1");
  const [animationStep, setAnimationStep] = useState(0);

  const intervalRef = useRef(null);
  const startTimeoutRef = useRef(null);

  function clearStartTimeout() {
    if (startTimeoutRef.current === null) return;
    window.clearTimeout(startTimeoutRef.current);
    startTimeoutRef.current = null;
  }

  function startAnimation() {
    setHasStarted(true);
    setDisplayText("\u00A0".repeat(text.length));
    setCurrentPhase("phase1");
    setAnimationStep(0);
  }

  // Trigger start
  useEffect(() => {
    if (shouldAnimate && !hasStarted) {
      clearStartTimeout();
      if (delay <= 0) { startAnimation(); return; }
      startTimeoutRef.current = window.setTimeout(() => {
        startTimeoutRef.current = null;
        startAnimation();
      }, delay * 1000);
    }
    return () => clearStartTimeout();
  }, [shouldAnimate, hasStarted]); // eslint-disable-line

  // Run animation tick
  useEffect(() => {
    if (!hasStarted) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (currentPhase === "phase1") runPhase1();
      else runPhase2();
    }, speed);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentPhase, animationStep, text, speed, hasStarted]); // eslint-disable-line

  // Reset on text change
  useEffect(() => {
    if (hasStarted) {
      setDisplayText("\u00A0".repeat(text.length));
      setCurrentPhase("phase1");
      setAnimationStep(0);
    }
    return () => {
      clearStartTimeout();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]); // eslint-disable-line

  function runPhase1() {
    const maxSteps = text.length * 2;
    const currentLength = Math.min(animationStep + 1, text.length);
    const chars = [];
    for (let i = 0; i < currentLength; i++) {
      chars.push(getRandomChar(chars[i - 1]));
    }
    for (let i = currentLength; i < text.length; i++) chars.push("\u00A0");
    setDisplayText(chars.join(""));
    if (animationStep < maxSteps - 1) {
      setAnimationStep((p) => p + 1);
    } else {
      setCurrentPhase("phase2");
      setAnimationStep(0);
    }
  }

  function runPhase2() {
    const revealedCount = Math.floor(animationStep / 2);
    const chars = [];
    for (let i = 0; i < revealedCount && i < text.length; i++) chars.push(text[i]);
    if (revealedCount < text.length) {
      chars.push(animationStep % 2 === 0 ? "_" : getRandomChar());
    }
    for (let i = chars.length; i < text.length; i++) chars.push(getRandomChar());
    setDisplayText(chars.join(""));
    if (animationStep < text.length * 2 - 1) {
      setAnimationStep((p) => p + 1);
    } else {
      setDisplayText(text);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
  }

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ fontFamily: "var(--font-mono)", display: "inline-block" }}
    >
      {displayText}
    </span>
  );
}
