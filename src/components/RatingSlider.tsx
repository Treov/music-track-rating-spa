"use client"

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}

export default function RatingSlider({ label, value, onChange, icon }: RatingSliderProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      
      // Animate the number change
      const duration = 200; // ms
      const steps = 10;
      const stepValue = (value - displayValue) / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          setIsAnimating(false);
          clearInterval(interval);
        } else {
          setDisplayValue(prev => prev + stepValue);
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <span 
          className={`text-lg font-semibold text-primary transition-all duration-200 ${
            isAnimating ? 'scale-110' : 'scale-100'
          }`}
          style={{
            transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {Math.round(displayValue)}
        </span>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          max={10}
          step={1}
          className="w-full transition-all duration-300 ease-out"
        />
        <div 
          className="absolute top-0 left-0 h-full pointer-events-none transition-all duration-300 ease-out"
          style={{
            width: `${(value / 10) * 100}%`,
            background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
            borderRadius: '9999px',
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}