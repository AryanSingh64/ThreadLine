export default function DashboardLayout({ children }) {
  return (
    <div
      id="dashboard-report"
      style={{
        marginTop: "var(--space-xl)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "var(--space-md)",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

