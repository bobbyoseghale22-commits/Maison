import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-label text-foreground/30">404</p>
      <h1 className="mt-3 font-display text-4xl italic text-foreground sm:text-5xl">
        Page not found.
      </h1>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild className="rounded-none">
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/products">Shop All</Link>
        </Button>
      </div>
    </div>
  );
}
