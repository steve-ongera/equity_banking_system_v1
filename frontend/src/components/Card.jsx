import './Card.css';

export default function Card({ children, className = '', style }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card__header">
      <div>
        <h2 className="card__title">{title}</h2>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card__action">{action}</div>}
    </div>
  );
}