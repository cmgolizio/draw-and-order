"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Stage, Layer, Line } from "react-konva";

// import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function DrawPage() {
  const { supabase, user } = useAuth();
  const [lines, setLines] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [currentSuspect, setCurrentSuspect] = useState(null);
  const [savedSuspects, setSavedSuspects] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [revealSuspect, setRevealSuspect] = useState(false);
  const stageRef = useRef(null);
  const isDrawing = useRef(false);

  const handleRevealSuspect = (e) => {
    e.preventDefault();

    setRevealSuspect((prev) => !prev);
  };
  // --- Drawing Handlers ---
  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, color, strokeWidth, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const updatedLines = [...lines];
    const lastLine = { ...updatedLines[updatedLines.length - 1] };
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    updatedLines.splice(updatedLines.length - 1, 1, lastLine);
    setLines(updatedLines);
  };

  const handleMouseUp = () => (isDrawing.current = false);
  const handleClear = () => setLines([]);

  // --- Color Contrast Util ---
  const getContrastingTextColor = (bgColor) => {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160 ? "#111" : "#fff";
  };

  const drawButtonActive = tool === "pen";
  const eraserButtonActive = tool === "eraser";
  const drawTextColor = getContrastingTextColor(color);

  // --- Convert Data URL to Blob ---
  function dataURLtoBlob(dataURL) {
    const [header, data] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  }

  // --- Save Drawing to Supabase Storage ---
  const handleSaveDrawing = async () => {
    if (!stageRef.current) return;
    if (!user) {
      alert("You must be signed in to save your drawing.");
      return;
    }

    setUploading(true);

    try {
      // Export Konva canvas to high-res PNG
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const blob = dataURLtoBlob(uri);

      // Define file path (Firebase)
      // const fileName = `drawing-${user.id}-${Date.now()}.png`;
      // const filePath = `${user.id}/${fileName}`;

      // Define file path (Supabase)
      const fileName = `drawing-${user.id}-${Date.now()}.png`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("drawings")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/png",
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("drawings").getPublicUrl(filePath);

      console.log("Uploaded drawing:", publicUrl);
      alert("Drawing uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- Handle Manual Upload (Photo of Sketch) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploadPreview(URL.createObjectURL(file));
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `photo-${user.id}-${Date.now()}.${fileExt}`;
    // const filePath = `${user.id}/${fileName}`;

    // const { error: uploadError } = await supabase.storage
    //   .from("drawings")
    //   .upload(filePath, file);
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("userId", user.id);

    const res = await fetch("/api/upload-drawing", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (result.success) {
      alert("Drawing uploaded successfully!");
      console.log("Public URL:", result.publicUrl);
    } else {
      alert("Upload failed: " + result.error);
    }

    setUploading(false);

    if (uploadError) {
      console.error(uploadError);
      alert("Upload failed.");
    } else {
      alert("Upload successful!");
    }
  };

  // const handleDrawSuspect = async () => {
  //   setAiError(null);
  //   setAiLoading(true);
  //   try {
  //     const response = await fetch("/api/suspects", { method: "POST" });
  //     const payload = await response.json();
  //     if (!response.ok || !payload.success) {
  //       throw new Error(payload.error || "Unable to draw suspect");
  //     }
  //     setCurrentSuspect(payload.data);
  //     setSavedSuspects((prev) => {
  //       if (!payload.data?.id) return prev;
  //       const existingIndex = prev.findIndex(
  //         (item) => item.id === payload.data.id
  //       );
  //       if (existingIndex !== -1) {
  //         const clone = [...prev];
  //         clone.splice(existingIndex, 1);
  //         return [payload.data, ...clone];
  //       }
  //       return [payload.data, ...prev];
  //     });
  //   } catch (error) {
  //     setAiError(error.message);
  //   } finally {
  //     setAiLoading(false);
  //   }
  // };

  // const handleLoadSavedSuspects = async () => {
  //   setAiError(null);
  //   setSavedLoading(true);
  //   try {
  //     const response = await fetch("/api/suspects?limit=9");
  //     const payload = await response.json();
  //     if (!response.ok || !payload.success) {
  //       throw new Error(payload.error || "Unable to load saved suspects");
  //     }
  //     setSavedSuspects(payload.data || []);
  //   } catch (error) {
  //     setAiError(error.message);
  //   } finally {
  //     setSavedLoading(false);
  //   }
  // };

  const handleDrawSuspect = async () => {
    setAiError(null);
    setAiLoading(true);
    try {
      const response = await fetch("/api/suspects", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to draw suspect");
      }
      setCurrentSuspect(payload.data);
      setSavedSuspects((prev) => {
        if (!payload.data?.id) return prev;
        const existingIndex = prev.findIndex(
          (item) => item.id === payload.data.id
        );
        if (existingIndex !== -1) {
          const clone = [...prev];
          clone.splice(existingIndex, 1);
          return [payload.data, ...clone];
        }
        return [payload.data, ...prev];
      });
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLoadSavedSuspects = async () => {
    setAiError(null);
    setSavedLoading(true);
    try {
      const response = await fetch("/api/suspects?limit=9");
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load saved suspects");
      }
      setSavedSuspects(payload.data || []);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setSavedLoading(false);
    }
  };

  return (
    <main className='flex flex-col xl:flex-row justify-center items-start gap-6 p-6'>
      <div className='flex justify-center items-start gap-6 w-full'>
        {/* Toolbar */}
        <div className='flex flex-col gap-3 items-stretch'>
          <h2 className='text-lg font-semibold text-center mb-2'>
            Official PD Art Supplies
          </h2>

          {/* Draw Button */}
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

          {/* Eraser Button */}
          <button
            onClick={() => setTool("eraser")}
            className={`px-4 py-2 rounded-md font-medium border transition-colors duration-150 hover:bg-[#fe8c8c] active:bg-[#ff6666 ${
              eraserButtonActive
                ? "bg-[#ff7b7b] text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Erase
          </button>

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

          {/* Color Picker */}
          <label className='flex flex-col items-center gap-1 text-sm mt-4'>
            Color
            <input
              type='color'
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className='w-10 h-10 cursor-pointer rounded-full border border-gray-300'
            />
          </label>

          {/* Brush Size */}
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

        {/* Canvas */}
        <div className='border border-gray-400 rounded-md shadow-md'>
          <Stage
            ref={stageRef}
            width={500}
            height={650}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className='bg-white rounded-md touch-none'
          >
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.tool === "eraser" ? "#ffffff" : line.color}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap='round'
                  lineJoin='round'
                  globalCompositeOperation={
                    line.tool === "eraser" ? "destination-out" : "source-over"
                  }
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      <section className='w-full xl:w-96 border border-gray-200 rounded-lg shadow-sm p-4 space-y-4 bg-white'>
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold'>AI Suspect Lab</h2>
          <p className='text-sm text-gray-600'>
            Generate a fresh lead with Hugging Face models. When credits run
            out, a random archived suspect will be used instead.
          </p>
        </div>

        <button
          onClick={handleDrawSuspect}
          disabled={aiLoading}
          className={`w-full px-4 py-2 rounded-md font-semibold text-white transition-colors duration-150 ${
            aiLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500"
          }`}
        >
          {aiLoading
            ? "Gathering witness statement..."
            : "Interview new witness"}
        </button>

        {aiError && (
          <p className='text-sm text-red-600 border border-red-200 rounded-md p-2 bg-red-50'>
            {aiError}
          </p>
        )}

        {currentSuspect && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-xs uppercase tracking-wide text-gray-500'>
              <span>Current suspect</span>
              <span>
                {currentSuspect.fromArchive
                  ? "Pulled from archive"
                  : "Generated just now"}
              </span>
            </div>
            <p className='text-3xl text-gray-800 whitespace-pre-line'>
              {currentSuspect.description}
            </p>
            <button
              onClick={(e) => handleRevealSuspect(e)}
              className='px-3 py-1 rounded-md font-medium border bg-yellow-500 text-white hover:bg-yellow-400 active:bg-yellow-600'
            >
              {revealSuspect ? "Hide Suspect" : "Reveal Suspect"}
            </button>
            {revealSuspect ? (
              <div className='border rounded-md overflow-hidden'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentSuspect.imageUrl}
                  alt='AI generated suspect'
                  className='w-full h-64 object-cover'
                  loading='lazy'
                />
              </div>
            ) : (
              <div className='w-full h-64 bg-transparent flex items-center justify-center text-center text-[12rem] text-gray-600 border rounded-md overflow-hidden'>
                <h1>?</h1>
              </div>
            )}
          </div>
        )}

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold'>Saved suspects</h3>
            <button
              onClick={handleLoadSavedSuspects}
              className='text-sm text-indigo-600 hover:underline'
            >
              Refresh
            </button>
          </div>
          {savedLoading ? (
            <p className='text-sm text-gray-500'>Loading archive...</p>
          ) : savedSuspects.length === 0 ? (
            <p className='text-sm text-gray-500'>No suspects loaded yet.</p>
          ) : (
            <p className='text-sm text-gray-500'>
              {savedSuspects.length} suspect
              {savedSuspects.length > 1 ? "s" : ""} in archive.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

{
  /* eslint-disable-next-line @next/next/no-img-element */
}

{
  /* <ul className='grid grid-cols-1 gap-3'>
              {savedSuspects.map((suspect) => (
                <li key={suspect.id} className='border rounded-md p-2'>
                  <div className='flex items-start gap-2'>
                    <img
                      src={suspect.imageUrl}
                      alt={`Suspect ${suspect.id}`}
                      className='w-16 h-16 object-cover rounded-md border'
                      loading='lazy'
                    />
                    <div className='text-xs text-gray-600 space-y-1'>
                      <p className='font-semibold text-gray-800'>
                        {suspect.description}
                      </p>
                      <p>
                        Saved{" "}
                        {new Date(suspect.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul> */
}
