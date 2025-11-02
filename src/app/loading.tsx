export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

