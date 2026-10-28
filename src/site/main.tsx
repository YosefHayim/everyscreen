import i18next from "i18next";
import { createRoot } from "react-dom/client";
import { initReactI18next } from "react-i18next";
import "./site.css";
import en from "./en.json";
import { LandingPage } from "./landing-page";

await i18next.use(initReactI18next).init({
  lng: "en",
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18next.language;
document.documentElement.dir = i18next.dir();

const rootElement = document.getElementById("root");
const isRootMissing = rootElement === null;
if (isRootMissing) throw new Error("Missing #root element");

createRoot(rootElement).render(<LandingPage />);
