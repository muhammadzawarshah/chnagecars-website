<<<<<<< HEAD
import Script from "next/script"

const scaleViewport = `
(function () {
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|bada|iemobile|BB[0-9.,:_-]{2,};/i.test(navigator.userAgent)) return;
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    var ww = window.innerWidth < window.screen.width ? window.innerWidth : window.screen.width;
    var mw = 465;
    var ratio = ww / mw;
    if (ww < mw) {
        meta.setAttribute("content", "initial-scale=" + ratio + ", minimum-scale=" + ratio + ", maximum-scale=" + ratio + ", user-scalable=no, width=" + ww);
        setTimeout(function () {
            meta.setAttribute("content", "initial-scale=" + ratio + ", minimum-scale=" + ratio + ", user-scalable=yes, width=" + ww);
        }, 300);
    } else {
        meta.setAttribute("content", "initial-scale=1.0, minimum-scale=1.0, user-scalable=yes, width=" + ww);
    }
=======
// The layout is designed for a minimum width of 465px. On narrower screens we
// render the page at 465px and scale it down to fit; wider screens (tablets,
// desktop) use the normal device-width viewport.
//
// This runs as a plain inline <script> in <head> (not next/script, which defers
// beforeInteractive scripts in the App Router) so the viewport is correct before
// the first paint. It appends its own meta tag because the last viewport meta wins.
const scaleViewport = `
(function () {
    var MIN_WIDTH = 465;
    var meta = document.createElement("meta");
    meta.name = "viewport";
    document.head.appendChild(meta);

    function deviceWidth() {
        var w = screen.width, h = screen.height;
        var type = screen.orientation && screen.orientation.type;
        var landscape = type ? type.indexOf("landscape") === 0 : Math.abs(window.orientation || 0) === 90;
        return landscape ? Math.max(w, h) : Math.min(w, h);
    }

    function apply() {
        var dw = deviceWidth();
        if (dw < MIN_WIDTH) {
            var scale = dw / MIN_WIDTH;
            meta.content = "width=" + MIN_WIDTH + ", initial-scale=" + scale + ", minimum-scale=" + scale;
        } else {
            meta.content = "width=device-width, initial-scale=1";
        }
    }

    apply();
    window.addEventListener("orientationchange", function () { setTimeout(apply, 100); });
    if (screen.orientation) screen.orientation.addEventListener("change", apply);
>>>>>>> origin/main
})();
`;

export default function ViewportScript() {
<<<<<<< HEAD
    return (
        <Script id="viewport-scale" strategy="beforeInteractive">
            {scaleViewport}
        </Script>
    )
=======
    return <script id="viewport-scale" dangerouslySetInnerHTML={{ __html: scaleViewport }} />
>>>>>>> origin/main
}
