"use client";

import { Download } from "lucide-react";

export default function ExportButton({ compact = false, summary = {}, moduleMap = {} }) {
  
  const generateMarkdown = () => {
    let md = `# ThreadLine OSINT Intelligence Report\n\n`;
    md += `**Target Query:** \`${summary.query || "Unknown"}\`  \n`;
    md += `**Target Type:** ${summary.inputType || "unknown"}  \n`;
    md += `**Timestamp:** ${new Date().toUTCString()}  \n\n`;
    md += `---\n\n`;
    
    // Assessment Section
    md += `## Threat Assessment\n`;
    md += `> **Risk Score:** ${summary.score?.score || 0}/100 (${summary.score?.label || "Unknown Risk"})\n\n`;
    
    if (summary.score?.breakdown?.length > 0) {
      md += `### Trace Factors\n`;
      summary.score.breakdown.forEach(b => {
        md += `- **[+${b.points}]** \`${b.module}\`: ${b.reason}\n`;
      });
      md += `\n`;
    }

    // AI Summary Section
    md += `---\n\n## AI Telemetry Analysis\n`;
    md += `${summary.explanation || "No telemetry explanation generated."}\n\n`;

    // Extracted Network Nodes
    md += `---\n\n## Discovered Entity Network (${summary.graph?.nodes?.length || 0} Nodes)\n`;
    if (summary.graph?.nodes?.length > 0) {
      summary.graph.nodes.forEach(n => {
         md += `- **${n.label}** (\`${n.type}\`)\n`;
      });
    } else {
      md += "*No remote network associations discovered.*\n";
    }
    md += `\n`;

    // Raw Intel Modules
    md += `---\n\n## Raw Module Dump\n\n`;
    const mods = Object.keys(moduleMap);
    if (mods.length === 0) {
      md += "*No modules executed successfully.*\n";
    } else {
      mods.forEach(modName => {
         md += `### Module: ${modName}\n`;
         md += "```json\n";
         try {
           md += JSON.stringify(moduleMap[modName].data || moduleMap[modName], null, 2);
         } catch(e) {
           md += "Unparseable output buffer";
         }
         md += "\n```\n\n";
      });
    }

    md += `---\n*Generated autonomously by ThreadLine Platform.*`;
    return md;
  };

  const handleExport = () => {
     const mdString = generateMarkdown();
     const blob = new Blob([mdString], { type: "text/markdown;charset=utf-8" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `ThreadLine-Report-${summary.query?.replace(/[^a-z0-9]/gi, '_') || "target"}.md`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      className={`btn-cta ${compact ? "btn-cta-compact" : ""}`.trim()}
      style={{ padding: "0 14px", height: compact ? "40px" : "56px" }}
      onClick={handleExport}
      title="Download Full OSINT Markdown Report"
    >
      <Download size={14} strokeWidth={2.5} />
      PULL
    </button>
  );
}
