export default function RevealSuspectButton({ onClick, isRevealed }) {
  return (
    <button
      onClick={onClick}
      className='px-4 py-2 rounded-full font-semibold border bg-yellow-500 text-white shadow-md hover:bg-yellow-400 active:bg-yellow-600'
    >
      {isRevealed ? "Hide Suspect" : "Reveal Suspect"}
    </button>
  );
}
