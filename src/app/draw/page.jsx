"use client";

import { useEffect, useRef, useState } from "react";

import DrawTools from "@/components/DrawTools";
import RevealSuspectButton from "@/components/RevealSuspectButton";
import { dataURLtoBlob } from "@/lib/canvas";
import CanvasStage from "@/components/CanvasStage";
import AiPanel from "@/components/AiPanel";
import LoadingMessage from "@/components/LoadingMessage";
import MobileActionButtons from "@/components/MobileActionButtons";

// import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function DrawPage() {
  const { supabase, user } = useAuth();
  const [lines, setLines] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [scoringMode, setScoringMode] = useState("black-and-white");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [redoStack, setRedoStack] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [scoreError, setScoreError] = useState(null);
  const [currentSuspect, setCurrentSuspect] = useState(null);
  const [suspectImage, setSuspectImage] = useState(null);
  const [silhouetteImage, setSilhouetteImage] = useState(null);
  const [showSilhouette, setShowSilhouette] = useState(false);
  const [revealSuspect, setRevealSuspect] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 500, height: 650 });
  const [isMobile, setIsMobile] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(currentSuspect ? true : false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [userAgreedTerms, setUserAgreedTerms] = useState(false);
  const stageRef = useRef(null);
  const isDrawing = useRef(false);

  const handleRevealSuspect = (e) => {
    // e.preventDefault();

    setRevealSuspect((prev) => !prev);
  };

  const handleToggleSilhouette = (e) => {
    e?.preventDefault?.();
    setShowSilhouette((prev) => !prev);
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
    // if (!(revealSuspect && currentSuspect?.imageUrl)) {
    if (!currentSuspect?.imageUrl) {
      setSuspectImage(null);
      setSilhouetteImage(null);
      setShowSilhouette(false);
      return undefined;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => setSuspectImage(img);
    img.src = currentSuspect.imageUrl;

    //   return () => setSuspectImage(null);
    // }, [revealSuspect, currentSuspect]);
    return () => {
      img.onload = null;
      setSuspectImage(null);
      setSilhouetteImage(null);
    };
  }, [currentSuspect]);

  useEffect(() => {
    if (!suspectImage) return undefined;

    let canceled = false;

    const buildSilhouette = () => {
      const canvas = document.createElement("canvas");
      canvas.width = stageSize.width;
      canvas.height = stageSize.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(suspectImage, 0, 0, stageSize.width, stageSize.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      const threshold = 200;
      const fillColor = [59, 130, 246];

      for (let i = 0; i < data.length; i += 4) {
        const brightness =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const alpha = brightness < threshold ? 210 : 0;

        data[i] = fillColor[0];
        data[i + 1] = fillColor[1];
        data[i + 2] = fillColor[2];
        data[i + 3] = alpha;
      }

      ctx.putImageData(imageData, 0, 0);

      const silhouette = new Image();
      silhouette.onload = () => {
        if (!canceled) {
          setSilhouetteImage(silhouette);
          setShowSilhouette(false);
        }
      };
      silhouette.src = canvas.toDataURL("image/png");
    };

    buildSilhouette();

    return () => {
      canceled = true;
    };
  }, [suspectImage, stageSize.width, stageSize.height]);

  // --- Drawing Handlers ---
  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines((prevLines) => [
      ...prevLines,
      { tool, color, strokeWidth, points: [pos.x, pos.y] },
    ]);
    setRedoStack([]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setLines((prevLines) => {
      if (!prevLines.length) return prevLines;

      const updatedLines = [...prevLines];
      const lastLine = { ...updatedLines[updatedLines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      updatedLines.splice(updatedLines.length - 1, 1, lastLine);
      return updatedLines;
    });
  };

  const handleMouseUp = () => (isDrawing.current = false);
  const handleClear = () => {
    setLines([]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    setLines((prevLines) => {
      if (!prevLines.length) return prevLines;

      const updatedLines = [...prevLines];
      const undoneLine = updatedLines.pop();
      setRedoStack((prevRedo) => [...prevRedo, undoneLine]);
      return updatedLines;
    });
  };

  const handleRedo = () => {
    setRedoStack((prevRedo) => {
      if (!prevRedo.length) return prevRedo;

      const updatedRedo = [...prevRedo];
      const redoneLine = updatedRedo.pop();
      setLines((prevLines) => [...prevLines, redoneLine]);
      return updatedRedo;
    });
  };

  const canUndo = lines.length > 0;
  const canRedo = redoStack.length > 0;

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
      // const fileName = `drawing-${user.uid}-${Date.now()}.png`;
      // const filePath = `${user.uid}/${fileName}`;
      const userId = user?.id || user?.uid;
      const fileName = `drawing-${userId}-${Date.now()}.png`;
      const filePath = `${userId}/${fileName}`;

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

  const uploadDrawingForUser = async (drawingBlob) => {
    if (!user) return null;

    const userId = user?.id || user?.uid;
    const fileName = `submission-${userId}-${Date.now()}.png`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from("drawings")
      .upload(filePath, drawingBlob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/png",
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("drawings")
      .getPublicUrl(filePath);

    return urlData?.publicUrl ?? null;
  };

  // const handleSubmitDrawing = async () => {
  //   if (!stageRef.current) return;
  //   if (!user) {
  //     alert("You must be signed in to submit your drawing.");
  //     return;
  //   }

  //   if (!currentSuspect?.imageUrl) {
  //     setScoreError("Interview a witness to get a suspect before submitting.");
  //     return;
  //   }

  //   setUploading(true);
  //   setScoring(true);
  //   setScoreError(null);
  //   setScoreResult(null);

  //   try {
  //     const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
  //     const blob = dataURLtoBlob(uri);
  //     const userId = user?.id || user?.uid;
  //     const fileName = `submission-${userId}-${Date.now()}.png`;
  //     const filePath = `${userId}/${fileName}`;

  //     const { error: uploadError } = await supabase.storage
  //       .from("drawings")
  //       .upload(filePath, blob, {
  //         cacheControl: "3600",
  //         upsert: false,
  //         contentType: "image/png",
  //       });

  //     if (uploadError) throw uploadError;

  //     const { data: urlData } = supabase.storage
  //       .from("drawings")
  //       .getPublicUrl(filePath);

  //     if (!urlData?.publicUrl) {
  //       throw new Error("Unable to create a public URL for this drawing");
  //     }

  //     const formData = new FormData();
  //     formData.append("originalImageUrl", currentSuspect.imageUrl);
  //     formData.append("userDrawingUrl", urlData.publicUrl);
  //     if (userId) formData.append("userId", userId);
  //     if (currentSuspect.id) formData.append("suspectId", currentSuspect.id);

  //     const response = await fetch("/api/score", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     const payload = await response.json();

  //     if (!response.ok) {
  //       throw new Error(payload.error || "Unable to score drawing");
  //     }

  //     setScoreResult({ ...payload, drawingUrl: urlData.publicUrl });
  //   } catch (error) {
  //     console.error(error);
  //     setScoreError(error.message);
  //   } finally {
  //     setUploading(false);
  //     setScoring(false);
  //   }
  // };
  const handleSubmitDrawing = async () => {
    if (!stageRef.current) return;
    // if (!user) {
    //   alert("You must be signed in to submit your drawing.");
    //   return;
    // }

    if (!currentSuspect?.imageUrl) {
      setScoreError("Interview a witness to get a suspect before submitting.");
      return;
    }

    setUploading(true);
    setScoring(true);
    setScoreError(null);
    setScoreResult(null);

    try {
      // Convert user's drawing to Blob
      const drawingUri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const drawingBlob = dataURLtoBlob(drawingUri);

      let savedDrawingUrl = null;

      if (user) {
        try {
          savedDrawingUrl = await uploadDrawingForUser(drawingBlob);
        } catch (saveError) {
          console.error("Auto-save failed:", saveError);
        }
      }

      // Fetch suspect image → Blob
      const suspectBlob = await fetch(currentSuspect.imageUrl).then((res) =>
        res.blob()
      );

      const formData = new FormData();
      formData.append("originalImage", suspectBlob, "suspect.png");
      formData.append("userDrawing", drawingBlob, "drawing.png");
      formData.append("scoringMode", scoringMode);

      const response = await fetch("/api/score", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to score drawing");
      }

      // setScoreResult(payload);
      setScoreResult({ ...payload, drawingUrl: savedDrawingUrl });
    } catch (error) {
      console.error(error);
      setScoreError(error.message);
    } finally {
      setUploading(false);
      setScoring(false);
    }
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

  const handleAgreeTerms = (e) => {
    e.preventDefault();
    setUserAgreedTerms(true);
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
        silhouetteImage={silhouetteImage}
        showSuspectImage={revealSuspect}
        showSilhouette={showSilhouette}
        lines={lines}
      />

      {isMobile && (!canvasReady || aiLoading) && (
        <div className='absolute inset-0 bg-gray-700/70 z-30 flex flex-col items-center justify-center text-gray-200 px-6 text-center'>
          {aiLoading ? (
            // <>
            //   <div className='h-12 w-12 border-4 border-white/50 border-t-transparent rounded-full animate-spin mb-4' />
            //   <p className='font-semibold text-lg'>
            //     Gathering witness statement...
            //   </p>
            // </>
            <LoadingMessage />
          ) : !userAgreedTerms ? (
            <>
              <span className='mb-8 text-center text-md'>
                This website is for entertainment purposes only. By proceeding,
                you acknowledge that any generated images are fictional and not
                representative of real individuals. Do you understand and agree
                to these terms?
              </span>
              <button
                onClick={(e) => handleAgreeTerms(e)}
                className='px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-500'
              >
                I understand
              </button>
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
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            setStrokeWidth={setStrokeWidth}
            scoringMode={scoringMode}
            setScoringMode={setScoringMode}
            handleClear={handleClear}
            handleSaveDrawing={handleSaveDrawing}
            handleSubmitDrawing={handleSubmitDrawing}
            uploading={uploading}
            scoring={scoring}
            handleFileUpload={handleFileUpload}
            uploadPreview={uploadPreview}
            canUndo={canUndo}
            canRedo={canRedo}
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

  const renderSilhouetteButton = () => {
    if (!currentSuspect || !silhouetteImage || isMobile) return null;

    const baseButtonClasses =
      "flex items-center gap-2 rounded-full font-semibold border bg-gray-500 text-white shadow-md hover:bg-gray-400 active:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400";

    return (
      <button
        onClick={handleToggleSilhouette}
        className={`${baseButtonClasses} px-4 py-3`}
      >
        <span role='img' aria-hidden className='text-lg'>
          👤
        </span>
        {showSilhouette ? "Hide silhouette guide" : "Show silhouette guide"}
      </button>
    );
  };

  const renderScorePanel = () => (
    <div className='w-full max-w-4xl mx-auto mt-8 px-4'>
      <div className='border border-gray-200 rounded-lg shadow-sm p-4 bg-white space-y-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold'>Scoring Pipeline</h3>
            <p className='text-sm text-gray-600'>
              Submit your drawing to upload it, trigger /api/score, save the
              result to Supabase, and update your score here.
            </p>
          </div>
          {scoreResult?.finalScore !== undefined && (
            <div className='text-right'>
              <p className='text-sm text-gray-500'>Final Score</p>
              <p className='text-3xl font-bold text-indigo-700'>
                {scoreResult.finalScore}
              </p>
            </div>
          )}
        </div>

        {scoreError && (
          <p className='text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2'>
            {scoreError}
          </p>
        )}

        {scoring && (
          <p className='text-sm text-gray-600'>Scoring in progress...</p>
        )}

        {!scoreResult && !scoring && !scoreError && (
          <p className='text-sm text-gray-600'>
            Press “Submit Drawing” after sketching to receive a similarity score
            against the current suspect.
          </p>
        )}

        {scoreResult && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm text-gray-700'>
                <span>Embedding score</span>
                <span className='font-semibold'>
                  {scoreResult.embeddingScore?.toFixed?.(1) ??
                    scoreResult.embeddingScore}
                </span>
              </div>
              <div className='flex justify-between text-sm text-gray-700'>
                <span>Trait score</span>
                <span className='font-semibold'>
                  {scoreResult.traitScore?.toFixed?.(1) ??
                    scoreResult.traitScore}
                </span>
              </div>
              <div className='flex justify-between text-sm text-gray-700'>
                <span>Landmark score</span>
                <span className='font-semibold'>
                  {scoreResult.landmarkScore?.toFixed?.(1) ??
                    scoreResult.landmarkScore}
                </span>
              </div>
            </div>

            <div className='border border-gray-100 rounded-md p-3'>
              <p className='text-sm font-semibold mb-2'>Trait breakdown</p>
              <div className='grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-gray-700'>
                {Object.entries(scoreResult.traitBreakdown || {}).map(
                  ([trait, value]) => (
                    <div key={trait} className='flex justify-between'>
                      <span className='capitalize'>{trait}</span>
                      <span className='font-semibold'>{value}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            setStrokeWidth={setStrokeWidth}
            scoringMode={scoringMode}
            setScoringMode={setScoringMode}
            handleClear={handleClear}
            handleSaveDrawing={handleSaveDrawing}
            handleSubmitDrawing={handleSubmitDrawing}
            uploading={uploading}
            scoring={scoring}
            handleFileUpload={handleFileUpload}
            uploadPreview={uploadPreview}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          <div className='flex flex-col items-center gap-3'>
            {renderCanvas("bg-white")}
            <div className='flex items-center gap-2 pt-1'>
              {renderRevealButton()}
              {renderSilhouetteButton()}
            </div>
            {/* <div className='pt-1'>{renderRevealButton()}</div> */}
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
              silhouetteActive={showSilhouette}
              silhouetteAvailable={!!silhouetteImage}
              onToggleTools={() => setToolbarOpen((prev) => !prev)}
              onToggleDescription={() => setDescriptionOpen((prev) => !prev)}
              onToggleReveal={handleRevealSuspect}
              onToggleSilhouette={handleToggleSilhouette}
              onExpand={resetMobilePanels}
              onUpload={handleFileUpload}
              currentSuspect={currentSuspect}
            />
          )}
        </div>
      </div>
      {renderScorePanel()}
    </main>
  );
}
