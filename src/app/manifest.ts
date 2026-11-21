import type { MetadataRoute } from "next";

// Lets phones install the site as an app (home-screen icon, opens full-screen without the browser bar).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SMART ORKHON — Ухаалаг Орхон",
    short_name: "Ухаалаг Орхон",
    description: "Орхон аймгийн мэдэгдэл, шуурхай мэдээ, автобус, төрийн үйлчилгээ, асуудал мэдээлэх, AI туслах нэг дор.",
    lang: "mn",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#003135",
    categories: ["government", "news", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Асуудал мэдээлэх", url: "/#report", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Газрын зураг", url: "/#map", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Мэдэгдэл", url: "/#notices", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
