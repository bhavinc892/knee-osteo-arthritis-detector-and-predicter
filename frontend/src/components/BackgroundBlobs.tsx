import React from 'react';

export default function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none bg-[#f1f7fa]">
      {/* Top Left Blob */}
      <svg
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] opacity-40 blur-3xl fill-[#d2e7f7]"
        viewBox="0 0 100 100"
      >
        <path d="M30,10 C50,20 70,10 90,30 C100,50 90,70 70,80 C50,90 30,80 10,60 C-10,40 10,20 30,10 Z" />
      </svg>

      {/* Top Right Blob */}
      <svg
        className="absolute -top-[5%] -right-[5%] w-[45%] h-[45%] opacity-30 blur-2xl fill-[#cce2f3]"
        viewBox="0 0 100 100"
      >
        <path d="M40,20 C60,10 80,20 90,40 C100,60 80,80 60,90 C40,100 20,80 10,60 C0,40 20,30 40,20 Z" />
      </svg>

      {/* Bottom Right Blob */}
      <svg
        className="absolute -bottom-[15%] -right-[10%] w-[60%] h-[60%] opacity-45 blur-3xl fill-[#d6ebf8]"
        viewBox="0 0 100 100"
      >
        <path d="M20,30 C40,10 70,20 85,40 C100,60 90,85 70,95 C50,105 20,90 10,70 C0,50 0,50 20,30 Z" />
      </svg>
    </div>
  );
}
