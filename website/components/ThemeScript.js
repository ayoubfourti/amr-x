const source = `(() => {
  try {
    const requested = new URLSearchParams(window.location.search).get("theme");
    const stored = window.localStorage.getItem("amrx-theme");
    const theme = requested === "light" || requested === "dark" ? requested : stored === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    if (requested === "light" || requested === "dark") window.localStorage.setItem("amrx-theme", theme);
  } catch (_) {
    document.documentElement.dataset.theme = "dark";
  }
})();`;

export default function ThemeScript() {
  // This must be a literal inline script in the initial document head. Using
  // next/script here can let the dark :root defaults paint before the saved
  // light theme is restored.
  return <script id="amrx-theme-init" dangerouslySetInnerHTML={{ __html: source }} />;
}
