const env = import.meta.env;

export const API_BASE_URL = (env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
export const CAFE_NAME = env.VITE_CAFE_NAME || "Kafe";
export const CAFE_LOGO_URL = env.VITE_CAFE_LOGO_URL || "";
export const CAFE_ADDRESS = env.VITE_CAFE_ADDRESS || "";
export const GOOGLE_REVIEW_URL = env.VITE_GOOGLE_REVIEW_URL || "";

export const cafeInitials = CAFE_NAME.split(/\s+/)
  .slice(0, 2)
  .map((w: string) => w[0]?.toUpperCase() ?? "")
  .join("");
