"use client";

import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

export default function ExportButton({ compact = false, summary = {}, moduleMap = {} }) {
  
  const handleExport = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageHeight = 297;
    const pageWidth = 210;
    let y = 15;

    // Helper to draw background and borders
    const drawPageStructure = () => {
      // Background
      doc.setFillColor(10, 14, 20); // #0a0e14
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Cyber borders
      doc.setDrawColor(30, 41, 59); // #1e293b
      doc.setLineWidth(0.8);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setDrawColor(15, 23, 42); // #0f172a
      doc.setLineWidth(0.3);
      doc.rect(6.5, 6.5, pageWidth - 13, pageHeight - 13);
      
      // Header Text
      doc.setTextColor(56, 189, 248); // #38bdf8 (cyan)
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.text("CLASSIFIED // SECURITY ASSESSMENT REPORT", 10, 11);
      
      doc.setTextColor(148, 163, 184); // #94a3b8
      doc.setFontSize(7);
      doc.text(`REPORT-ID: TL-${Math.floor(100000 + Math.random() * 900000)}`, pageWidth - 65, 11);
    };

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - 15) {
        doc.addPage();
        drawPageStructure();
        y = 20;
      }
    };

    // Draw Page 1
    drawPageStructure();
    y = 22;

    // Platform Logo/Name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("THREADLINE", 10, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text("OSINT DIGITAL INTELLIGENCE PLATFORM", 10, y + 5);

    // Date
    doc.setFontSize(8);
    doc.text(new Date().toUTCString(), pageWidth - 80, y);
    y += 12;

    // Divider
    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(0.5);
    doc.line(10, y, pageWidth - 10, y);
    y += 8;

    // Metadata Grid
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("TARGET PROFILE METADATA", 10, y);
    
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    
    doc.text(`IDENTIFIER:  ${summary.query || "Unknown"}`, 12, y);
    doc.text(`TARGET TYPE: ${summary.inputType?.toUpperCase() || "UNKNOWN"}`, 12, y + 5);
    doc.text(`SCAN MODE:   ${summary.mode?.toUpperCase() || "STANDARD"}`, 12, y + 10);
    
    y += 18;

    // Threat Score Meter block
    const scoreVal = summary.score?.score || 0;
    const scoreLabel = summary.score?.label || "Unknown Risk";
    
    // Choose threat color
    let scoreColor = [16, 185, 129]; // Emerald (Low)
    if (scoreVal > 60) {
      scoreColor = [244, 63, 94]; // Rose (High)
    } else if (scoreVal > 25) {
      scoreColor = [245, 158, 11]; // Amber (Moderate)
    }

    doc.setFillColor(30, 41, 59); // background for score card
    doc.rect(10, y, pageWidth - 20, 18, "F");
    
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.rect(10, y, 4, 18, "F"); // Left border line highlight

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OVERALL THREAT POSTURE SCORE", 18, y + 7);
    
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`CLASSIFICATION:  `, 18, y + 13);
    
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(scoreLabel.toUpperCase(), 47, y + 13);

    // Large Score bubble
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.rect(pageWidth - 35, y + 2, 20, 14, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const scoreText = `${scoreVal}`;
    doc.text(scoreText, pageWidth - 28, y + 11.5);
    
    y += 24;

    // Risk factors
    const breakdown = summary.score?.breakdown || [];
    if (breakdown.length > 0) {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("IDENTIFIED RISK FACTORS", 10, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      breakdown.forEach((item) => {
        checkPageBreak(8);
        doc.setTextColor(244, 63, 94);
        doc.text(`[+${item.points} pts]`, 12, y);
        doc.setTextColor(148, 163, 184);
        const text = doc.splitTextToSize(`${item.module}: ${item.reason}`, pageWidth - 42);
        doc.text(text, 28, y);
        y += (text.length * 4) + 1;
      });
      y += 4;
    }

    // AI Telemetry Section
    checkPageBreak(40);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("AI TELEMETRY ANALYSIS", 10, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    const explanationText = summary.explanation || "No telemetry analysis compiled.";
    const wrappedExplanation = doc.splitTextToSize(explanationText, pageWidth - 24);
    doc.text(wrappedExplanation, 12, y);
    y += (wrappedExplanation.length * 4.2) + 8;

    // Discovered Network Associations
    const nodes = summary.graph?.nodes || [];
    if (nodes.length > 0) {
      checkPageBreak(30);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("DISCOVERED NETWORK ASSOCIATIONS", 10, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      
      // Render in two columns
      let leftCol = true;
      nodes.forEach((node) => {
        checkPageBreak(6);
        const xPos = leftCol ? 12 : (pageWidth / 2) + 2;
        doc.setTextColor(56, 189, 248);
        doc.text("•", xPos, y);
        doc.setTextColor(255, 255, 255);
        doc.text(node.label, xPos + 3, y);
        doc.setTextColor(148, 163, 184);
        doc.text(` (${node.type})`, xPos + 3 + doc.getTextWidth(node.label), y);
        
        if (!leftCol) {
          y += 5;
        }
        leftCol = !leftCol;
      });
      if (!leftCol) {
        y += 5;
      }
      y += 6;
    }

    // Confidential Footer
    checkPageBreak(12);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    doc.line(10, y, pageWidth - 10, y);
    y += 5;
    
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(244, 63, 94); // red label
    doc.text("CLASSIFIED INFORMATION // DO NOT DUPLICATE", 10, y);
    doc.setTextColor(148, 163, 184);
    doc.text("GENERATED AUTONOMOUSLY BY THREADLINE SECURITY ENGINE", pageWidth - 100, y);

    // Save PDF
    doc.save(`ThreadLine-Report-${summary.query?.replace(/[^a-z0-9]/gi, '_') || "target"}.pdf`);
  };

  return (
    <button
      type="button"
      className={`btn-cta ${compact ? "btn-cta-compact" : ""}`.trim()}
      style={{ padding: "0 14px", height: compact ? "40px" : "56px" }}
      onClick={handleExport}
      title="Download Full OSINT PDF Briefing Report"
    >
      <Download size={14} strokeWidth={2.5} />
      PULL
    </button>
  );
}
