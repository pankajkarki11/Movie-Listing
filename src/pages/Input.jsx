const Input = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className = "",
  containerClassName = "",
  ...props
}) => {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 ">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* this makes the the childern in the div ables to use absoluite so we can insert the icons inside the input field by using absoilute on the childern class */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* Here we use absoluteto remove the element that is icon from the normal document flow and position it relative to nearest relative parents,
          insert-y-0=used to stretch the element from top to bottom of parents to make it central vertically,left-0=used to keep icon at leftmost part of the parents,pl-3=used to add some space to the left of the icon,flex items-center=used to make the icon vertical centered,pointer-events-none=used to make the icon not clickable and transparent to mouse clicks */}
            {leftIcon}
          </div>
        )}
{/* Block make sinput takes full width of parents,w-full=used to make the input take 100%  of parents container*/}
        <input
          className={`
            block w-full rounded-lg border 

           
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "focus:ring-2 focus:ring-[#01A49E]/30 focus:border-[#01A49E] transition text-base bg-gray-50/50 border-gray-300 "
            }
            ${leftIcon ? "pl-10" : "pl-3"}
            ${rightIcon ? "pr-10" : "pr-3"}
            py-2.5
            bg-white 
            text-gray-900 
            placeholder-gray-400 
            focus:outline-none focus:ring-2
            transition-colors duration-200
            ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
              onRightIconClick ? "cursor-pointer" : "pointer-events-none"
            }`}
            onClick={onRightIconClick}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 ">
          *{helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
