import './StatCard.css';

export default function StatCard({ icon, label, value, sub, accent = 'green', delay = 0 }) {
  return (
    <div className={"stat-card fade-up"} style={{ animationDelay: delay + 'ms' }}>
      <div className={"stat-card__icon stat-card__icon--" + accent}>
        <i className={"bi " + icon} />
      </div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}