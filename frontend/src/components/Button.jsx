import './Button.css';

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, icon, className = '', ...props
}) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading
        ? <i className="bi bi-arrow-repeat spin" />
        : icon && <i className={`bi ${icon}`} />
      }
      <span>{children}</span>
    </button>
  );
}