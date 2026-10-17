import type { MetadataRoute } from "next";
import { APP_NAME, SCHOOL_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ${SCHOOL_NAME}`,
    short_name: "Maintenance",
    description: `Maintenance work orders for ${SCHOOL_NAME}`,
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1f5f9",
    theme_color: "#1d3fae",
    categories: ["productivity", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New work order", url: "/work-orders/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My work orders", url: "/work-orders", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
