"use client";

import { useState, useEffect } from "react";

const firstMessage = "Gathering witness statement...";
const secondMessage =
  "This may take a moment… but hang tight, and thanks for your patience!";

export default function LoadingMessage() {
  const [showSecondMessage, setShowSecondMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSecondMessage(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    // <div style={{ color: "white", fontSize: "1.2rem", lineHeight: "1.6rem" }}>
    <>
      <div className='h-12 w-12 border-4 border-white/50 border-t-transparent rounded-full animate-spin mb-4' />
      <p className='font-semibold text-lg'>{firstMessage}</p>
      {showSecondMessage && <p className='text-md'>{secondMessage}</p>}
    </>
  );
}

// <>
//   <div className='h-12 w-12 border-4 border-white/50 border-t-transparent rounded-full animate-spin mb-4' />
//   <p className='font-semibold text-lg'>
//     Gathering witness statement...
//   </p>
// </>
