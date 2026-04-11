"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function ExportButton({ compact = false }) {
  const handleExport = async () => {
    const container = document.getElementById("dashboard-report");
    if (!container) return;

    const canvas = await html2canvas(container, {
      backgroundColor: "#0a0a0a",
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.setFontSize(16);
    pdf.text("ThreadLine Intelligence Report", 40, 36);
    pdf.setFontSize(10);
    pdf.text(new Date().toLocaleString(), 40, 52);
    pdf.addImage(imgData, "PNG", 24, 72, width - 48, Math.min(height, 700));
    pdf.save("threadline-report.pdf");
  };

  return (
    <button
      type="button"
      className={`btn-cta ${compact ? "btn-cta-compact" : ""}`.trim()}
      onClick={handleExport}
    >
      Export Report
    </button>
  );
}
