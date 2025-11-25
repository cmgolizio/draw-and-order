"use client";

import { useState } from "react";

export default function RevealSuspectButton({ onClick, isRevealed, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = isMobile ? expanded : true;

  const handleClick = (e) => {
    if (isMobile && !isExpanded) {
      e.preventDefault();
      setExpanded(true);
      return;
    }

    if (isMobile && isRevealed) {
      setExpanded(false);
    }

    onClick?.(e);
  };

  const baseButtonClasses =
    "flex items-center gap-2 rounded-full font-semibold border bg-yellow-500 text-white shadow-md hover:bg-yellow-400 active:bg-yellow-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400";

  const mobileWrapperClasses = isMobile ? "fixed bottom-5 right-5 z-40" : "";

  const buttonSizeClasses = isExpanded
    ? "px-4 py-3"
    : "h-12 w-12 flex justify-center py-0";

  return (
    <div className={mobileWrapperClasses}>
      <button
        onClick={handleClick}
        className={`${baseButtonClasses} ${buttonSizeClasses}`}
        aria-label='Reveal suspect'
      >
        <span role='img' aria-hidden className='text-lg'>
          👁️
        </span>
        {isExpanded && (
          <span>{isRevealed ? "Hide Suspect" : "Reveal Suspect"}</span>
        )}
      </button>
    </div>
  );
}
