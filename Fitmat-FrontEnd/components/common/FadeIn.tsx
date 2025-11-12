import React, { useEffect, useRef, useState } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  className?: string;
}

export default function FadeIn({
  children,
  delay = 0,
  duration = 600,
  direction = 'up',
  className = '',
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay]);

  const getTransformClasses = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return 'translate-y-8 opacity-0';
        case 'down':
          return '-translate-y-8 opacity-0';
        case 'left':
          return 'translate-x-8 opacity-0';
        case 'right':
          return '-translate-x-8 opacity-0';
        case 'fade':
          return 'opacity-0';
        default:
          return 'translate-y-8 opacity-0';
      }
    }
    return 'translate-y-0 translate-x-0 opacity-100';
  };

  return (
    <div
      ref={elementRef}
      className={`transition-all ease-out ${getTransformClasses()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
