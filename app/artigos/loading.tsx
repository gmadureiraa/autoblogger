export default function Loading() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#10b981] flex items-center justify-center">
                <span className="text-background font-mono font-bold text-xs">A</span>
              </div>
              <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">
                AutoBlogger
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              carregando artigos...
            </span>
          </div>
        </nav>
      </div>

      <div className="px-4 lg:px-6 py-12 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="h-3 w-24 bg-foreground/10 mb-4 animate-pulse" />
          <div className="h-10 w-72 bg-foreground/10 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-foreground/20 bg-background/40 p-5 flex flex-col gap-3 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-2 w-16 bg-foreground/10" />
              <div className="h-5 w-5/6 bg-foreground/15" />
              <div className="h-5 w-2/3 bg-foreground/15" />
              <div className="h-3 w-full bg-foreground/10 mt-3" />
              <div className="h-3 w-4/6 bg-foreground/10" />
              <div className="flex items-center gap-2 mt-4">
                <div className="h-2 w-10 bg-foreground/10" />
                <div className="h-2 w-10 bg-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
