import './FormCard.css';

export default function FormCard({ title, icon, children, accent = 'green' }) {
  return (
    <div className={"form-card fade-up form-card--" + accent}>
      <div className="form-card__header">
        <span className={"form-card__icon form-card__icon--" + accent}>
          <i className={"bi " + icon} />
        </span>
        <h2 className="form-card__title">{title}</h2>
      </div>
      <div className="form-card__body">{children}</div>
    </div>
  );
}