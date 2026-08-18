import React from "react";

const Card = ({ children, className = "", hoverable = true }) => {
  return (
    <div
      className={`
      bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden
      ${
        hoverable
          ? "transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1"
          : ""
      }
      ${className}
    `}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = "" }) => {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
