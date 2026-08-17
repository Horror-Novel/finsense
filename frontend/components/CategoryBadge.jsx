export default function CategoryBadge({ category }) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink/50 transition-transform hover:scale-105">
        Uncategorized
      </span>
    );
  }
  return (
    <span className="pop-in inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest-light transition-transform hover:scale-105 hover:border-forest/50">
      <span aria-hidden>{category.icon || "💰"}</span>
      {category.name}
    </span>
  );
}