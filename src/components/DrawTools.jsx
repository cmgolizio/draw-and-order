"use client";

import Image from "next/image";
import { SlActionRedo, SlActionUndo } from "react-icons/sl";

export default function DrawTools({
  tool,
  color,
  strokeWidth,
  setTool,
  setColor,
  handleUndo,
  handleRedo,
  setStrokeWidth,
  scoringMode,
  setScoringMode,
  handleClear,
  handleSaveDrawing,
  handleSubmitDrawing,
  uploading,
  scoring,
  handleFileUpload,
  uploadPreview,
  canUndo,
  canRedo,
}) {
  const drawButtonActive = tool === "pen";
  const eraserButtonActive = tool === "eraser";
  const blackAndWhite = scoringMode === "black-and-white";

  const toggleScoringMode = () =>
    setScoringMode(blackAndWhite ? "color" : "black-and-white");

  const getContrastingTextColor = (bgColor) => {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160 ? "#111" : "#fff";
  };

  const drawTextColor = getContrastingTextColor(color);

  return (
    <div className='flex flex-col gap-3 items-stretch'>
      <h2 className='text-lg font-semibold text-center mb-2'>
        Official PD Art Supplies
      </h2>

      <button
        onClick={() => setTool("pen")}
        className={`px-4 py-2 rounded-md font-medium border transition-colors duration-150 ${
          drawButtonActive
            ? "text-white"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
        style={
          drawButtonActive
            ? { backgroundColor: color, color: drawTextColor }
            : {}
        }
      >
        Draw
      </button>

      <button
        onClick={() => setTool("eraser")}
        className={`px-4 py-2 rounded-md font-medium border transition-colors duration-150 hover:bg-[#fe8c8c] active:bg-[#ff6666] ${
          eraserButtonActive
            ? "bg-[#ff7b7b] text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        Erase
      </button>

      <div className='grid grid-cols-2 gap-2'>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium border transition-colors duration-150 ${
            canUndo
              ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          aria-label='Undo last stroke'
        >
          <SlActionUndo />
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium border transition-colors duration-150 ${
            canRedo
              ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          aria-label='Redo last stroke'
        >
          <SlActionRedo />
          Redo
        </button>
      </div>

      <button
        onClick={handleClear}
        className='px-4 py-2 rounded-md font-medium border bg-red-600 text-white hover:bg-red-500 active:bg-red-700'
      >
        Clear
      </button>

      <button
        onClick={handleSaveDrawing}
        disabled={uploading}
        className={`px-4 py-2 rounded-md font-medium border bg-green-600 text-white hover:bg-green-500 active:bg-green-700 ${
          uploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {uploading ? "Saving..." : "Save Drawing"}
      </button>

      <button
        onClick={handleSubmitDrawing}
        disabled={uploading || scoring}
        className={`px-4 py-2 rounded-md font-medium border bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 ${
          uploading || scoring ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {scoring ? "Scoring..." : "Submit Drawing"}
      </button>

      <hr className='my-3 border-gray-300' />

      <h3 className='text-md font-semibold text-center'>Upload Sketch</h3>
      <input
        type='file'
        accept='image/*'
        onChange={handleFileUpload}
        className='text-sm'
      />

      {uploadPreview && (
        <div className='mt-2 border rounded-md overflow-hidden'>
          <Image
            src={uploadPreview}
            alt='Uploaded preview'
            className='object-contain'
            height={60}
            width={60}
          />
        </div>
      )}

      <div className='mt-4 border rounded-md px-3 py-2 flex items-center justify-between gap-3'>
        <div>
          <p className='text-sm font-semibold'>Scoring mode</p>
          <p className='text-xs text-gray-600'>
            Black & white removes color-based traits.
          </p>
        </div>
        <div className='flex items-center gap-2 text-xs font-semibold text-gray-700'>
          <span className={!blackAndWhite ? "text-indigo-600" : ""}>Color</span>
          <button
            type='button'
            onClick={toggleScoringMode}
            role='switch'
            aria-checked={blackAndWhite}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 ${
              blackAndWhite ? "bg-gray-800" : "bg-indigo-500"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-150 ${
                blackAndWhite ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className={blackAndWhite ? "text-indigo-600" : ""}>B/W</span>
        </div>
      </div>

      <label className='flex flex-col items-center gap-1 text-sm mt-4'>
        Color
        <input
          type='color'
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className='w-10 h-10 cursor-pointer rounded-full border border-gray-300'
        />
      </label>

      <label className='flex flex-col items-center gap-1 text-sm'>
        Brush
        <input
          type='range'
          min='1'
          max='40'
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className='hover:cursor-pointer'
        />
        <span>{strokeWidth}px</span>
      </label>
    </div>
  );
}
