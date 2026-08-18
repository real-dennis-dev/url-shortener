// frontend/components/common/IconWrapper.jsx

import React from "react";

const sizes = {
  xs: "h-3 w-3 text-xs",
  sm: "h-4 w-4 text-sm",
  md: "h-5 w-5 text-base",
  lg: "h-6 w-6 text-lg",
  xl: "h-8 w-8 text-xl",
  "2xl": "h-10 w-10 text-2xl",
};

const sizePixels = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
};

export const IconWrapper = ({
  icon,
  size = "md",
  color = "currentColor",
  className = "",
  onClick,
  title,
  ...props
}) => {
  const sizeClass = sizes[size] || sizes.md;
  const pixelSize = sizePixels[size] || sizePixels.md;

  // Nothing to render
  if (!icon) {
    return null;
  }

  const wrapperClasses = `
    inline-flex
    items-center
    justify-center
    shrink-0
    ${onClick ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}
    ${className}
  `;

  /*
   * ---------------------------------------------------------
   * STRING / EMOJI ICON
   * ---------------------------------------------------------
   *
   * Examples:
   *
   * <IconWrapper icon="👤" />
   * <IconWrapper icon="⚙️" />
   * <IconWrapper icon="👥" />
   */
  if (typeof icon === "string") {
    return (
      <span
        className={wrapperClasses}
        onClick={onClick}
        title={title}
        aria-hidden={title ? undefined : true}
        {...props}
      >
        <span
          className="leading-none flex items-center justify-center"
          style={{
            fontSize: `${pixelSize}px`,
            lineHeight: 1,
            color,
          }}
        >
          {icon}
        </span>
      </span>
    );
  }

  /*
   * ---------------------------------------------------------
   * REACT COMPONENT ICON
   * ---------------------------------------------------------
   *
   * Examples:
   *
   * <IconWrapper icon={UserIcon} />
   * <IconWrapper icon={SettingsIcon} />
   *
   * Works with libraries such as:
   * Lucide React
   * Heroicons
   * React Icons
   */
  if (typeof icon === "function" || typeof icon === "object") {
    const Icon = icon;

    return (
      <span
        className={wrapperClasses}
        onClick={onClick}
        title={title}
        aria-hidden={title ? undefined : true}
        {...props}
      >
        <Icon
          className={sizeClass}
          style={{ color }}
          aria-hidden={title ? undefined : true}
        />
      </span>
    );
  }

  // Unsupported icon type
  console.warn("IconWrapper: Unsupported icon type:", typeof icon, icon);

  return null;
};

export default IconWrapper;
