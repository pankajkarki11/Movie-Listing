const Input = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className = "",
  containerClassName = "",
  labelClassName = "",
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <span className={`text-xs font-semibold uppercase tracking-wide text-slate-400 ${labelClassName}`}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}

      <div className="relative flex">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        <input
          className={`
            h-8 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none ring-emerald-500/60 transition focus:ring-2
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500 ring-red-500/60' : ''}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div
            className={`absolute inset-y-0 right-0 pr-3 flex items-center z-10 ${
              onRightIconClick ? "cursor-pointer" : "pointer-events-none"
            }`}
            onClick={onRightIconClick}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;