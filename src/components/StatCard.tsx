export default function StatCard({
  titre,
  valeur,
  sous,
  accent = 'text-encre',
}: {
  titre: string
  valeur: string
  sous?: string
  accent?: string
}) {
  return (
    <div className="carte p-4">
      <p className="etiquette">{titre}</p>
      <p className={`mt-1.5 truncate text-2xl font-extrabold tabular-nums ${accent}`}>{valeur}</p>
      {sous && <p className="mt-1 truncate text-xs text-fade">{sous}</p>}
    </div>
  )
}
