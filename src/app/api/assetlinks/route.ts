// Digital Asset Links, served at /.well-known/assetlinks.json (see the rewrite in next.config.ts).
// Proves to Android that the Google Play app and this site belong together, so the app opens the site
// full screen without a browser bar. Set in Vercel → Settings → Environment Variables:
//   ANDROID_SHA256_FINGERPRINTS = the "SHA-256 certificate fingerprint" values, comma-separated
//     (Play Console → Test and release → App integrity → App signing key, plus the upload key)
//   ANDROID_PACKAGE_ID (optional) = the app's package name, default mn.smartorkhon.app (android/twa-manifest.json)
export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_ID?.trim() || "mn.smartorkhon.app";
  const prints = (process.env.ANDROID_SHA256_FINGERPRINTS || "")
    .split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  const body = prints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
