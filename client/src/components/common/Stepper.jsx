// Stepper.jsx
export const Stepper = ({
  steps,
  currentStep,
  onStepChange,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepChange && onStepChange(index)}
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full font-weight-bold transition-colors
                    ${isCompleted ? "bg-primary-500 text-neutral-100" : ""}
                    ${
                      isCurrent
                        ? "border-2 border-primary-500 bg-neutral-100 text-primary-500"
                        : ""
                    }
                    ${
                      !isCompleted && !isCurrent
                        ? "border-2 border-neutral-300 bg-neutral-100 text-neutral-500"
                        : ""
                    }
                  `}
                  disabled={!onStepChange}
                >
                  {isCompleted ? "✓" : index + 1}
                </button>
                <span
                  className={`
                  mt-2 text-xs font-weight-medium
                  ${
                    isCompleted || isCurrent
                      ? "text-primary-500"
                      : "text-neutral-500"
                  }
                `}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  h-0.5 flex-1 transition-colors
                  ${index < currentStep ? "bg-primary-500" : "bg-neutral-300"}
                `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
