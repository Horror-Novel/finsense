export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="animate-fade-in-up rounded-lg border border-brick/40 bg-brick/10 px-4 py-3 text-sm text-brick shadow-[0_0_20px_-8px_rgba(226,98,75,0.4)]">
      {message}
    </div>
  );
}