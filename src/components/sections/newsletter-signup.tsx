"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Newsletter signup — a full-width editorial moment, distinct from
 * the compact form already in `Footer` (same page, so this one earns
 * its place with a different layout: centered, large type, its own
 * section rather than a footer column).
 *
 * Client Component only for the minimal submit-state handling below;
 * no network call is wired yet since no newsletter API/action exists
 * — submitting just acknowledges receipt locally. Swap the handler
 * for a real server action once one exists.
 */
export function NewsletterSignup() {
  const [status, setStatus] = React.useState<"idle" | "submitted">("idle");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitted");
  }

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="bg-foreground text-background"
    >
      <div className="container flex flex-col items-center gap-6 py-20 text-center sm:py-24">
        <p className="text-label text-background/50">Stay In Touch</p>
        <h2
          id="newsletter-heading"
          className="max-w-xl font-display text-3xl italic sm:text-4xl"
        >
          Join the list for early access and private appointments.
        </h2>

        {status === "submitted" ? (
          <p role="status" className="text-sm text-background/80">
            Thank you — you&rsquo;re on the list.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-2 flex w-full max-w-sm flex-col gap-3 sm:flex-row"
            noValidate
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder="Email address"
              className="w-full border border-background/30 bg-transparent px-4 py-3 text-sm text-background placeholder:text-background/50 focus:border-background focus:outline-none"
            />
            <Button
              type="submit"
              size="lg"
              className="shrink-0 rounded-none bg-background text-foreground hover:bg-background/90"
            >
              Subscribe
            </Button>
          </form>
        )}

        <p className="max-w-xs text-xs text-background/40">
          By subscribing, you agree to receive marketing emails. Unsubscribe
          anytime.
        </p>
      </div>
    </section>
  );
}
