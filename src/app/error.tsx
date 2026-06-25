"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-4xl italic text-foreground sm:text-5xl">
        Something went wrong.
      </h1>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Please try again, or contact support if the problem persists.
      </p>
      <Button onClick={reset} className="mt-8 rounded-none">
        Try Again
      </Button>
    </div>
  );
}
