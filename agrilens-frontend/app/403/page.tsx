export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-8xl font-black text-muted-foreground/30 select-none">403</div>
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm">
        You do not have permission to view this page. Please contact your administrator if
        you believe this is a mistake.
      </p>
      <a
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        ← Back to Home
      </a>
    </div>
  );
}
