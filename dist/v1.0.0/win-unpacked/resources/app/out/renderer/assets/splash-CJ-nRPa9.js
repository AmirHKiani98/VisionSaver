import { j as jsxRuntimeExports, D as CircularProgress, M as createTheme, N as clientExports, a as reactExports, O as ThemeProvider } from "./CircularProgress-Bnc0HUVL.js";
const splashBg = "" + new URL("traffic_splash_bg-D44sxDoZ.jpg", import.meta.url).href;
function Splash() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "relative min-h-screen min-w-screen items-center justify-center bg-main-600 text-white",
      style: { backgroundImage: `url(${splashBg})`, backgroundSize: "cover" },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute z-10 h-screen w-screen backdrop-blur-sm bg-white/30",
            style: {
              clipPath: "polygon(0 0, 0 90%, 90% 0, 0 0)"
              // edit this to shape the diagonal
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute z-10 h-screen w-screen backdrop-blur-sm bg-white/30",
            style: {
              clipPath: "polygon(20% 100%, 100% 100%, 100% 20%, 20% 100%)"
              // edit this to shape the diagonal
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute z-20 bottom-5 left-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-row items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold", children: "Starting server..." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm mt-2", children: [
            "Photo by",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: "https://unsplash.com/@berkinuregen?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash",
                target: "_blank",
                rel: "noopener noreferrer",
                children: "Berkin Üregen"
              }
            ),
            " ",
            "on",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: "https://unsplash.com/photos/traffic-light-under-blue-sky-during-daytime-gf9J4fyJKD0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash",
                target: "_blank",
                rel: "noopener noreferrer",
                children: "Unsplash"
              }
            )
          ] })
        ] })
      ]
    }
  );
}
const theme = createTheme({
  palette: {
    primary: {
      light: "#a6ecf3",
      // main-100
      main: "#b8c9df",
      // main-200
      dark: "#18375e",
      // main-700
      contrastText: "#000"
    },
    secondary: {
      light: "#ffffff",
      // white
      main: "#f5f5f5",
      // very light gray
      dark: "#cccccc",
      // lower white (gray)
      contrastText: "#000"
    },
    white: {
      main: "#ffffff",
      contrastText: "#000"
    }
  }
});
const rootElement = document.getElementById("root");
rootElement.className = "min-h-screen min-w-screen bg-main-600";
clientExports.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeProvider, { theme, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Splash, {}) }) })
);
