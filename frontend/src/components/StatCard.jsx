export default function StatCard({ label, value, type = '', icon }) {
  return (
    <div className={`stat-card ${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">${Number(value).toFixed(2)}</div>
        </div>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
    </div>
  );
}
