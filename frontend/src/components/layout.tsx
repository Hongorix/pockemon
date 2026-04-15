import { Link, Outlet } from '@tanstack/react-router'

export const Layout = () => {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <header className="comic-panel mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="comic-title text-4xl md:text-6xl">Pokemon Collection Builder</h1>
          </div>
          <Link to="/" className="comic-button">
            Home
          </Link>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
