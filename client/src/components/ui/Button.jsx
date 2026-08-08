const Button = ({
  children,
  variant = "amber",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
}) => {
  const base = "btn inline-flex items-center justify-center";

  const variants = {
    amber: "btn-amber",
    ghost: "btn-ghost",
    teal: "btn-teal",
    danger: "btn-danger",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

export default Button;
