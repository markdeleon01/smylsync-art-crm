import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="text-3xl font-semibold text-foreground mt-4">Not Found</h2>
        <p className="text-muted-foreground mt-2">This page could not be found</p>
      </div>
      <Link
        href="/"
        className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
      >
        Return to Home
      </Link>
    </div>
  );
}
