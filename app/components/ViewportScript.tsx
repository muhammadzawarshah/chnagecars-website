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
        meta.setAttribute("content", "initial-scale=" + ratio + ", minimum-scale=" + ratio + ", user-scalable=yes, width=" + ww);
    } else {
        meta.setAttribute("content", "initial-scale=1.0, minimum-scale=1.0, user-scalable=yes, width=" + ww);
    }
})();
`;

export default function ViewportScript() {
    return (
        <Script id="viewport-scale" strategy="beforeInteractive">
            {scaleViewport}
        </Script>
    )
}
