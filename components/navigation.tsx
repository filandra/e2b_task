'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
const categories = [{ key: 'Chat', href: '/chat' }];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-cyan/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <img
              src="/logo.png"
              alt="Helpers Hands"
              className="w-10 h-10 rounded-full transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center space-x-4 flex-1">
            {categories.map((category) => {
              const isActive = pathname === category.href;
              return (
                <Link key={category.key} href={category.href}>
                  <Button
                    className={`${
                      isActive
                        ? 'bg-amber text-navy border-amber hover:bg-amber hover:text-navy'
                        : 'bg-charcoal/80 hover:bg-cyan text-white hover:text-navy border border-cyan/30 hover:border-cyan'
                    } transition-all duration-300 font-medium px-6 py-2`}
                  >
                    {category.key}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Horizontal Navigation */}
        <div className="md:hidden py-3 border-t border-cyan/20">
          <div className="relative">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-1">
              {categories.map((category) => {
                const isActive = pathname === category.href;
                return (
                  <Link
                    key={category.key}
                    href={category.href}
                    className="flex-shrink-0"
                  >
                    <Button
                      size="sm"
                      className={`${
                        isActive
                          ? 'bg-amber text-navy border-amber hover:bg-amber hover:text-navy'
                          : 'bg-charcoal/80 hover:bg-cyan text-white hover:text-navy border border-cyan/30 hover:border-cyan'
                      } transition-all duration-300 font-medium whitespace-nowrap px-4 py-2`}
                    >
                      {category.key}
                    </Button>
                  </Link>
                );
              })}
            </div>
            {/* Fade gradient to indicate scrollable content */}
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-navy to-transparent pointer-events-none"></div>
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-navy to-transparent pointer-events-none opacity-0 scroll-fade-left"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}
