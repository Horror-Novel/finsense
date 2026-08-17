export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/60 animate-fade-in">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-forest/15" />
        <div
          className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-forest-light border-r-forest/40"
          role="status"
          aria-label={label}
        />
        <div className="absolute inset-0 rounded-full bg-forest/10 blur-md" />
      </div>
      <p className="font-sans text-sm">
        {label}
        <span className="dot-flashing ml-1 align-middle text-forest-light">
          <span />
          <span />
          <span />
        </span>
      </p>
    </div>
  );
}