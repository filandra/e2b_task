'use client';

import React from 'react';

export default function HeroSection() {
  return (
    <div className="relative">
      {/* Full viewport hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-charcoal">
        {/* Minimal background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-amber/5"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight animate-fade-in">
            <span className="text-white">{'Helpers'}</span>{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan via-amber to-cyan bg-clip-text text-transparent animate-gradient-x">
                Hands
              </span>
            </span>
          </h1>

          {/* Updated subtitle */}
          <p
            className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            {'A simple AI assistant to help you with your tasks.'}
          </p>

          {/* Subtle call to action */}
          <div
            className="flex justify-center animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan rounded-full animate-pulse"></div>
              {'Explore by clicking the chat button above'}
            </div>
          </div>
        </div>

        {/* Little animator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-1 h-8 bg-gradient-to-b from-cyan to-transparent rounded-full"></div>
        </div>
      </section>
    </div>
  );
}
