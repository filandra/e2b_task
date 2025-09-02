'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and description */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Helpers Hands"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-white font-bold text-lg">
                Helpers Hands
              </span>
            </div>
            <p className="text-gray-400 text-sm text-center md:text-left max-w-md">
              {'E2B Task'}
            </p>
          </div>

          {/* Contact */}
          <div className="flex items-center space-x-6 text-sm">
            <a
              href="https://www.linkedin.com/in/filandra/"
              className="text-gray-400 hover:text-cyan transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Adam Filandr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
