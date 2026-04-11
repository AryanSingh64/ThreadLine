"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConsoleAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/investigate");
  }, [router]);

  return <div style={{ minHeight: "100vh", background: "var(--bg-void)" }} />;
}

