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
})();
`;

export default function ViewportScript() {
    return <script id="viewport-scale" dangerouslySetInnerHTML={{ __html: scaleViewport }} />
}
