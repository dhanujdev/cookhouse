"use client";

import type { Step } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center space-x-2 sm:space-x-4">
        {steps.map((step, index) => (
          <li key={step.name} className="relative flex-1">
            {index < steps.length -1 && (
              <div
                className={cn(
                  "absolute inset-0 top-4 left-0 ml-4 -mr-2 h-0.5 w-full bg-gray-300",
                  index < currentStep -1 || completedSteps.includes(step.id) ? "bg-primary" : "",
                  index === currentStep -1 ? "bg-primary" : ""
                )}
                aria-hidden="true"
              />
            )}
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full",
                completedSteps.includes(step.id) || currentStep > step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.id
                  ? "border-2 border-primary bg-background text-primary"
                  : "border-2 border-gray-300 bg-background text-gray-500"
              )}
            >
              {completedSteps.includes(step.id) || currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-xs font-semibold">{step.id}</span>
              )}
              <span className="sr-only">{step.name}</span>
            </div>
            <p
              className={cn(
                "mt-2 text-center text-xs font-medium sm:text-sm",
                currentStep === step.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step.name}
            </p>
          </li>
        ))}
      </ol>
    </nav>
  );
}
