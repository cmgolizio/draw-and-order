"use client";

export default function AiPanel({
  compact = false,
  aiLoading,
  aiError,
  currentSuspect,
  revealSuspect,
  handleDrawSuspect,
  handleRevealSuspect,
  savedLoading,
  savedSuspects,
  handleLoadSavedSuspects,
}) {
  const currentSuspectText =
    "Below you'll find the description of the suspect, given by an eye witness. Follow it, as well as your SketchPD Academy training, and help bring this crime to justice!";

  const noCurrentSuspectText =
    "Interview a new witness to gather a detailed description of a criminal suspect. Use this description to create a sketch of the perpetrator.";

  return (
    <section
      className={`w-full ${
        compact
          ? "space-y-3"
          : "xl:w-96 border border-gray-200 rounded-lg shadow-sm p-4 space-y-4 bg-white"
      }`}
    >
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>AI Suspect Lab</h2>
        <p className='text-sm text-gray-600'>
          {currentSuspect ? currentSuspectText : noCurrentSuspectText}
        </p>
      </div>

      <button
        onClick={handleDrawSuspect}
        disabled={aiLoading}
        className={`w-full px-4 py-2 rounded-md font-semibold text-white transition-colors duration-150 ${
          aiLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500"
        } ${compact ? "" : ""}`}
      >
        {aiLoading ? "Gathering witness statement..." : "Interview new witness"}
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
            className={`px-3 py-1 rounded-md font-medium border bg-yellow-500 text-white hover:bg-yellow-400 active:bg-yellow-600 ${
              compact ? "hidden" : ""
            }`}
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
            <div className='w-full h-64 bg-transparent flex items-center justify-center text-center text-[10rem] text-gray-600 border rounded-md overflow-hidden'>
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
  );
}
