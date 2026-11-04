/** Where the Light/Dark choice is kept (absent = System). Shared by the inline script and ThemeToggle. */
export const THEME_KEY = "dekiru-theme";

/** Runs in <head> before the page paints, so a saved Light/Dark choice never flashes the other theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
