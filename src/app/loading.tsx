export default function Loading() {
  return (
    <div className="page">
      <div className="skeleton hero-skeleton" />
      <div className="catalog-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    </div>
  );
}
