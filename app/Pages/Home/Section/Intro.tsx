export default function Intro() {
    return (
        <>
            <section className="relative float-right flex h-full w-[60%] flex-col items-start justify-center pl-5 max-[1653px]:w-[65%] max-[1168px]:w-[calc(63%-27px)] max-[1111px]:mt-25 max-[1040px]:w-[59%] max-[981px]:float-none max-[981px]:m-0 max-[981px]:h-auto max-[981px]:w-full max-[981px]:pt-3.25 max-[981px]:pb-6.25 max-[981px]:pl-0 max-[875px]:pb-1.25">
                <div className="w-full">
                    <h1 className="m-0 mb-3.75 w-full text-center text-[41px] leading-9.5 font-light text-snow max-[1441px]:mb-2.25 max-[1441px]:text-[40px] max-[1441px]:leading-11.25 max-[1046px]:mb-2.75 max-[1046px]:text-4xl max-[1046px]:leading-12 max-[981px]:mb-5 max-[981px]:text-[43px] max-[981px]:leading-13.25 max-[501px]:text-[40px] max-[501px]:leading-12.5">
                        New & Used Cars <span><span className="font-bold whitespace-pre text-gold">For Sale</span></span>
                    </h1>
                </div>

                <div className="flex w-full items-center justify-center gap-5 max-[981px]:mb-0 max-[981px]:flex-col max-[981px]:gap-3.75">
                    <h2 className="m-0 shrink-0 pb-0 text-center text-xl leading-6.75 font-normal text-snow max-[1046px]:text-base max-[981px]:text-[15px]">
                        <a href="https://www.changecars.co.za/insurance/car-and-warranty-solutions" className="text-white no-underline">
                            Let CHANGECARS get you <strong>10</strong> insurance quotes in <strong>10</strong> minutes
                        </a>
                    </h2>
                </div>

                <div className="relative mt-2.5 mb-5.25 max-[992px]:w-[94%] max-[981px]:hidden">
                    <video width="100%" playsInline preload="auto" muted autoPlay loop className="block">
                        <source src="https://player.vimeo.com/progressive_redirect/playback/1083297206/rendition/1080p/file.mp4%20(1080p).mp4?loc=external&log_user=0&signature=2fe93e3ac1e889eea46c89380a99b4f48b13640056e17ffc4a652df802b10e2e" type="video/mp4" />
                    </video>
                </div>

                <a href="https://www.changecars.co.za/insurance/car-and-warranty-solutions" className="absolute top-25.75 left-1/2 z-3 inline-block -translate-x-1/2 rounded-[5px] bg-gold px-6.25 py-3 font-medium text-white no-underline transition-colors duration-300 max-[981px]:static max-[981px]:mx-auto max-[981px]:my-5 max-[981px]:block max-[981px]:translate-x-0 max-[601px]:px-3.75 max-[601px]:py-2.5 max-[601px]:hover:opacity-80">
                    Get Insured with VAPSSA
                </a>
            </section>
        </>
    )
}
