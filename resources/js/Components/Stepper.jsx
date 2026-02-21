import React from 'react';

/**
 * Stepper - composant d'étapes horizontales avec surbrillance de l'étape active
 * @param {number} stepCount - nombre total d'étapes
 * @param {number} currentStep - étape active (1-indexée)
 * @param {string[]} labels - libellés des étapes
 */
export default function Stepper({ stepCount, currentStep, labels = [] }) {
  return (
    <div className="flex items-center justify-center w-full mb-8">
      {Array.from({ length: stepCount }).map((_, idx) => {
        const step = idx + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full w-10 h-10 flex items-center justify-center font-bold border-2 transition-colors duration-200 ${
                  isActive
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : isCompleted
                    ? 'bg-orange-200 border-orange-500 text-orange-700'
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}
              >
                {step}
              </div>
              {labels[step - 1] && (
                <span className="mt-2 text-xs text-center w-20">
                  {labels[step - 1]}
                </span>
              )}
            </div>
            {step < stepCount && (
              <div className={`flex-1 h-1 mx-2 transition-colors duration-200 ${
                isCompleted ? 'bg-orange-500' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
