"use client"

import { useState, useEffect, useRef } from "react";
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
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (displayValue !== value) {
      const startValue = displayValue;
      const endValue = value;
      const startTime = performance.now();
      const duration = 400; // ms - увеличена длительность для более плавной анимации

      // Easing function для плавной анимации (easeOutCubic)
      const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
      };

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        
        const currentValue = startValue + (endValue - startValue) * easedProgress;
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
        }
      };

      // Отменяем предыдущую анимацию если она есть
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [value]);

  // Форматируем отображаемое значение
  const formattedValue = displayValue % 1 === 0 
    ? Math.round(displayValue) 
    : displayValue.toFixed(1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <span 
          className="text-lg font-semibold text-primary transition-transform duration-150 ease-out"
          style={{
            transform: displayValue !== value ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {formattedValue}
        </span>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          max={10}
          step={1}
          className="w-full"
        />
        <div 
          className="absolute top-0 left-0 h-full pointer-events-none transition-all duration-300 ease-out"
          style={{
            width: `${(value / 10) * 100}%`,
            background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%)',
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