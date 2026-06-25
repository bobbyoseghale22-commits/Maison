import type { NextConfig } from "next";

/**
 * Security headers applied to every response via Next.js's built-in
 * `headers()` config — no external middleware or CDN required.
 *
 * Each header is explained inline so future maintainers know what
 * it does and when (if ever) it should be changed.
 */
const securityHeaders = [
  // Prevent the page from being embedded in an <iframe> on another
  // origin — eliminates clickjacking attacks. "SAMEORIGIN" allows
  // iframes within the same domain (e.g. Stripe's hosted elements).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Prevent browsers from MIME-sniffing a response away from its
  // declared Content-Type (e.g. treating a .txt upload as executable).
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Controls how much referrer information is included with requests.
  // "strict-origin-when-cross-origin" sends origin+path on same-origin,
  // only origin on cross-origin HTTPS→HTTPS, and nothing on HTTPS→HTTP.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Restrict access to browser features. Disabling unused powerful
  // APIs reduces the attack surface if a dependency is compromised.
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",          // no camera access
      "microphone=()",      // no mic access
      "geolocation=()",     // no GPS
      "payment=(self https://js.stripe.com)", // Stripe only
      "usb=()",
      "interest-cohort=()", // no FLoC
    ].join(", "),
  },

  // Content-Security-Policy — the most important header.
  //
  // Approach: start restrictive ('none' everywhere except where the
  // app concretely needs a source), then open per-feature.
  //
  // `nonce`-based scripts would be more secure but require dynamic
  // header generation per-request. The hash/strict-dynamic approach
  // is the recommended upgrade path when nonces are wired in.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Stripe (checkout iframe) + Cloudinary widget
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://widget.cloudinary.com",
      // Note: 'unsafe-inline' is needed for Next.js's inline script
      // chunks. Migrate to nonces (next.config.ts cspNonce) to remove it.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self, data URIs (Next.js blurDataURL), Cloudinary CDN
      "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
      // Connect (fetch/XHR/WebSocket): self + Stripe APIs + Cloudinary upload
      "connect-src 'self' https://api.stripe.com https://api.cloudinary.com https://upload.cloudinary.com",
      // Stripe's hosted payment page loads in a frame
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Upgrade HTTP requests to HTTPS automatically
      "upgrade-insecure-requests",
    ].join("; "),
  },

  // HTTP Strict Transport Security — tell browsers to always use HTTPS
  // for this domain for 1 year, including subdomains.
  // Only apply in production (dev usually runs on HTTP localhost).
  // The `includeSubDomains` directive is intentionally omitted here
  // because some deployments have subdomain services on HTTP.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME ?? "**"}/image/upload/**`,
      },
      // Google OAuth avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/a/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Breakpoints that cover mobile (390), tablet (768), desktop (1280, 1920)
    // and the product gallery size (640). Fewer breakpoints = fewer cache variants.
    deviceSizes: [390, 640, 768, 1024, 1280, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache optimized images for 30 days on the CDN / reverse proxy
    minimumCacheTTL: 2592000,
  },

  // Render's web services run behind a proxy; standalone output keeps
  // the production image small and self-contained.
  output: "standalone",

  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  experimental: {
    serverActions: {
      // Prevents server actions from accepting bodies larger than 5 MB,
      // limiting the blast radius of large-payload denial-of-service.
      bodySizeLimit: "5mb",
    },
  },

  async headers() {
    return [
      {
        // Security headers on all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Long-lived cache for Next.js static chunks (they have content hashes in filenames)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Moderate cache for API responses that are safe to cache
        source: "/api/products/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
