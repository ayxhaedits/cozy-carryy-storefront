import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroSlide } from '../types/store';

interface HeroSliderProps {
  slides: HeroSlide[];
  onAction: (targetCategory: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides, onAction }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const safeSlides = slides.length > 0 ? slides : [];

  useEffect(() => {
    if (index >= safeSlides.length) {
      setIndex(0);
    }
  }, [safeSlides.length, index]);

  useEffect(() => {
    if (paused || safeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [paused, safeSlides.length]);

  if (safeSlides.length === 0) return null;

  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + safeSlides.length) % safeSlides.length);
  const nextSlide = () => setIndex((prev) => (prev + 1) % safeSlides.length);

  return (
    <section
      className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-stone-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured storefront highlights"
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {safeSlides.map((slide, i) => {
          const isActive = i === index;
          return (
            <div
              key={slide.id || i}
              className="min-w-full h-full relative overflow-hidden"
            >
              <img
                src={slide.img}
                alt={slide.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${
                  isActive ? 'animate-ken-burns' : ''
                }`}
              />
              {/* Measured Contrast Scrim */}
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/45 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-8 flex items-center">
                {isActive && (
                  <div
                    key={`slide-content-${slide.id}-${index}`}
                    className="max-w-xl text-white animate-fade-up"
                  >
                    {slide.kicker && (
                      <p className="text-xs sm:text-sm font-medium tracking-widest uppercase text-stone-200 mb-3">
                        {slide.kicker}
                      </p>
                    )}
                    <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white mb-4">
                      {slide.title}
                    </h1>
                    <p className="text-sm sm:text-base text-stone-200/95 leading-relaxed mb-7 max-w-lg">
                      {slide.desc}
                    </p>
                    <button
                      type="button"
                      onClick={() => onAction(slide.targetCategory || 'All')}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-lg"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <span>{slide.btn || 'Shop Now'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {safeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Progress Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
            {safeSlides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === index ? 'w-10 bg-white' : 'w-4 bg-white/45 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
