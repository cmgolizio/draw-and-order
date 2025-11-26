"use client";

import { useRef } from "react";

export function ActionButton({
  id,
  icon,
  label,
  onClick,
  expandedButton,
  ariaLabel,
}) {
  const isExpanded = expandedButton === id;
  const buttonSizeClasses = isExpanded
    ? "pl-3 pr-4 h-12"
    : "h-12 w-12 justify-center px-0";

  return (
    <button
      onClick={onClick}
      className={`pointer-events-auto flex items-center gap-2 rounded-full border border-gray-200 bg-white text-gray-800 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:-translate-y-0.5 ${buttonSizeClasses}`}
      aria-label={ariaLabel || label}
    >
      <span className='flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-lg'>
        {icon}
      </span>
      {isExpanded && (
        <span className='whitespace-nowrap text-sm font-semibold tracking-tight'>
          {label}
        </span>
      )}
    </button>
  );
}

export function UploadActionButton({
  expandedButton,
  requestExpand,
  onUpload,
}) {
  const fileInputRef = useRef(null);
  const isExpanded = expandedButton === "upload";

  const handleClick = (e) => {
    e.preventDefault();

    if (requestExpand("upload")) return;

    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    if (!event.target.files?.length) return;

    onUpload?.(event);
    fileInputRef.current.value = "";
  };

  return (
    <div className='pointer-events-auto'>
      <ActionButton
        id='upload'
        icon='📤'
        label={isExpanded ? "Upload Sketch" : "Upload"}
        onClick={handleClick}
        expandedButton={expandedButton}
      />
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileChange}
        className='hidden'
      />
    </div>
  );
}
