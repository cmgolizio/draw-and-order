"use client";

import { useEffect, useRef, useState } from "react";

import DrawTools from "@/components/DrawTools";
import RevealSuspectButton from "@/components/RevealSuspectButton";
import { dataURLtoBlob } from "@/lib/canvas";
import CanvasStage from "@/components/CanvasStage";
import AiPanel from "@/components/AiPanel";
import MobileActionButtons from "@/components/MobileActionButtons";

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
  const [suspectImage, setSuspectImage] = useState(null);
  const [revealSuspect, setRevealSuspect] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 500, height: 650 });
  const [isMobile, setIsMobile] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const stageRef = useRef(null);
  const isDrawing = useRef(false);

  const handleRevealSuspect = (e) => {
    // e.preventDefault();

    setRevealSuspect((prev) => !prev);
  };

  const resetMobilePanels = () => {
    setToolbarOpen(false);
    setDescriptionOpen(false);
    setRevealSuspect(false);
  };

  useEffect(() => {
    const updateSizing = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (mobile) {
        const margin = 12;
        const width = Math.max(320, window.innerWidth - margin * 2);
        const height = Math.max(420, window.innerHeight - margin * 2);
        setStageSize({ width, height });
      } else {
        setStageSize({ width: 500, height: 650 });
        setCanvasReady(true);
      }
    };

    updateSizing();
    window.addEventListener("resize", updateSizing);
    return () => window.removeEventListener("resize", updateSizing);
  }, []);

  useEffect(() => {
    if (currentSuspect && isMobile) {
      setCanvasReady(true);
    }
  }, [currentSuspect, isMobile]);

  useEffect(() => {
    if (!(revealSuspect && currentSuspect?.imageUrl)) {
      setSuspectImage(null);
      return undefined;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => setSuspectImage(img);
    img.src = currentSuspect.imageUrl;

    return () => setSuspectImage(null);
  }, [revealSuspect, currentSuspect]);

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

      // Define file path
      const fileName = `drawing-${user.uid}-${Date.now()}.png`;
      const filePath = `${user.uid}/${fileName}`;

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user) {
      alert("You must be signed in to upload a sketch.");
      return;
    }

    setUploading(true);
    setUploadPreview(URL.createObjectURL(file));

    const fileExt = file.name.split(".").pop();
    const fileName = `upload-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("drawings")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);

    if (error) {
      console.error(error);
      alert("Upload failed: " + error.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("drawings")
      .getPublicUrl(filePath);

    console.log("Uploaded sketch URL:", urlData.publicUrl);

    alert("Sketch uploaded successfully!");
  };

  const handleDrawSuspect = async () => {
    setAiError(null);
    setAiLoading(true);
    if (isMobile) {
      setCanvasReady(false);
    }
    try {
      const response = await fetch("/api/suspects", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to draw suspect");
      }
      setCurrentSuspect(payload.data);
      if (isMobile) {
        setCanvasReady(true);
      }
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const renderCanvas = (wrapperClass = "") => (
    <div
      className={`relative ${
        isMobile
          ? "rounded-xl overflow-hidden shadow-xl bg-white"
          : "border border-gray-400 rounded-md shadow-md"
      } ${wrapperClass}`}
      style={
        isMobile ? { width: stageSize.width, height: stageSize.height } : {}
      }
    >
      <CanvasStage
        stageRef={stageRef}
        stageSize={stageSize}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        suspectImage={suspectImage}
        lines={lines}
      />

      {isMobile && (!canvasReady || aiLoading) && (
        <div className='absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center text-white px-6 text-center'>
          {aiLoading ? (
            <>
              <div className='h-12 w-12 border-4 border-white/50 border-t-transparent rounded-full animate-spin mb-4' />
              <p className='font-semibold text-lg'>
                Gathering witness statement...
              </p>
            </>
          ) : (
            <button
              onClick={handleDrawSuspect}
              className='px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-500'
            >
              Interview a witness
            </button>
          )}
        </div>
      )}

      {/* {isMobile && canvasReady && (
        <div className='absolute top-3 left-3 z-20 flex gap-2'>
          <button
            onClick={() => setToolbarOpen((prev) => !prev)}
            className='h-10 w-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-800 font-bold'
            aria-label='Toggle tools'
          >
            ✏️
          </button>
          <button
            onClick={() => setDescriptionOpen((prev) => !prev)}
            className='h-10 w-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-800 font-bold'
            aria-label='Toggle description'
          >
            ℹ️
          </button>
        </div>
      )} */}

      {isMobile && canvasReady && toolbarOpen && (
        <div className='absolute inset-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl z-30 overflow-auto p-4 max-h-[90vh]'>
          <div className='flex justify-end mb-2'>
            <button
              onClick={() => setToolbarOpen(false)}
              className='text-sm text-gray-500 hover:text-gray-800'
            >
              Close
            </button>
          </div>
          <DrawTools
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            setTool={setTool}
            setColor={setColor}
            setStrokeWidth={setStrokeWidth}
            handleClear={handleClear}
            handleSaveDrawing={handleSaveDrawing}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            uploadPreview={uploadPreview}
          />
        </div>
      )}

      {isMobile && canvasReady && descriptionOpen && (
        <div className='absolute inset-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl z-30 overflow-auto p-4 max-h-[90vh]'>
          <div className='flex justify-end mb-2'>
            <button
              onClick={() => setDescriptionOpen(false)}
              className='text-sm text-gray-500 hover:text-gray-800'
            >
              Close
            </button>
          </div>
          <AiPanel
            compact
            aiLoading={aiLoading}
            aiError={aiError}
            currentSuspect={currentSuspect}
            revealSuspect={revealSuspect}
            handleDrawSuspect={handleDrawSuspect}
          />
        </div>
      )}
    </div>
  );

  const renderRevealButton = () => {
    // if (!currentSuspect) return null;
    if (!currentSuspect || isMobile) return null;

    return (
      <RevealSuspectButton
        onClick={(e) => handleRevealSuspect(e)}
        isRevealed={revealSuspect}
        isMobile={isMobile}
      />
    );
  };

  return (
    <main className='min-h-screen bg-white'>
      <div className='hidden lg:flex flex-col xl:flex-row justify-center items-start gap-6 p-6'>
        <div className='flex justify-center items-start gap-6 w-full'>
          <DrawTools
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            setTool={setTool}
            setColor={setColor}
            setStrokeWidth={setStrokeWidth}
            handleClear={handleClear}
            handleSaveDrawing={handleSaveDrawing}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            uploadPreview={uploadPreview}
          />
          <div className='flex flex-col items-center gap-3'>
            {renderCanvas("bg-white")}
            <div className='pt-1'>{renderRevealButton()}</div>
          </div>
        </div>
        <AiPanel
          aiLoading={aiLoading}
          aiError={aiError}
          currentSuspect={currentSuspect}
          revealSuspect={revealSuspect}
          handleDrawSuspect={handleDrawSuspect}
        />
      </div>

      <div className='lg:hidden flex items-center justify-center min-h-screen bg-gray-100 p-3 overflow-hidden'>
        <div className='flex flex-col items-center gap-3 w-full'>
          {renderCanvas("mx-auto")}
          {/* <div className='pt-1'>{renderRevealButton()}</div> */}
          {canvasReady && (
            <MobileActionButtons
              toolbarOpen={toolbarOpen}
              descriptionOpen={descriptionOpen}
              revealActive={revealSuspect}
              onToggleTools={() => setToolbarOpen((prev) => !prev)}
              onToggleDescription={() => setDescriptionOpen((prev) => !prev)}
              onToggleReveal={handleRevealSuspect}
              onExpand={resetMobilePanels}
              onUpload={handleFileUpload}
            />
          )}
        </div>
      </div>
    </main>
  );
}
