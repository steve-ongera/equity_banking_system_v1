import './FormInput.css';

export default function FormInput({
  label, icon, error, hint, ...props
}) {
  return (
    <div className="finput">
      {label && <label className="finput__label">{label}</label>}
      <div className={`finput__wrap ${error ? 'finput__wrap--error' : ''}`}>
        {icon && <i className={`bi ${icon} finput__icon`} />}
        <input className={`finput__el ${icon ? 'finput__el--icon' : ''}`} {...props} />
      </div>
      {error && <span className="finput__error"><i className="bi bi-exclamation-circle" /> {error}</span>}
      {hint && !error && <span className="finput__hint">{hint}</span>}
    </div>
  );
}

export function FormSelect({ label, icon, error, children, ...props }) {
  return (
    <div className="finput">
      {label && <label className="finput__label">{label}</label>}
      <div className={`finput__wrap ${error ? 'finput__wrap--error' : ''}`}>
        {icon && <i className={`bi ${icon} finput__icon`} />}
        <select className={`finput__el finput__el--select ${icon ? 'finput__el--icon' : ''}`} {...props}>
          {children}
        </select>
      </div>
      {error && <span className="finput__error"><i className="bi bi-exclamation-circle" /> {error}</span>}
    </div>
  );
}