export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-[600px] animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
