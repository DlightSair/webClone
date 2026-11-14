// Glassy play button used on trend/reel thumbnails (markup copied from the original)
const SHAPE = "M57.6 30.7629C61.8667 33.2263 61.8667 39.3826 57.6 41.846L14.4 66.7885C10.1333 69.2519 4.79999 66.1738 4.79999 61.247L4.79999 11.3619C4.79999 6.43513 10.1333 3.357 14.4 5.8204L57.6 30.7629Z";
const MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 72'%3E%3Cpath d='${SHAPE}' fill='black'/%3E%3C/svg%3E")`;

export default function PlayButton({ className = "" }) {
  return (
    <div className={`relative flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}>
      <div className="relative w-[64px] h-[72px] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]">
        <div
          className="absolute inset-0 bg-white/20 backdrop-blur-md"
          style={{ maskImage: MASK, maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center center" }}
        />
        <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 z-10 pointer-events-none">
          <path d={SHAPE} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2.5" strokeLinejoin="round" />
          <path
            d="M55.2 32.1485C57.8667 37.5207 57.8667 37.5207 55.2 39.0604L15.6 61.9238C12.9333 63.4635 9.59999 61.5473 9.59999 58.4678L9.59999 12.7411C9.59999 9.66164 12.9333 7.7454 15.6 9.28514L55.2 32.1485Z"
            fill="white"
            fillOpacity="0.08"
          />
        </svg>
      </div>
    </div>
  );
}
