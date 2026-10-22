export default function Checkbox({ checked, partial = false }: { checked: boolean, partial?: boolean }) {

    const state = checked
        ? "border-[#9d885c] bg-[#9d885c] bg-[url(/img/check.svg)]"
        : partial
            ? "relative border-text-dark bg-text-dark after:absolute after:top-0.75 after:left-0.75 after:block after:size-2.25 after:rounded-[3px] after:bg-white after:content-['']"
            : "border-[#7c7c7c]";

    return (
        <span className={`float-left mt-1.75 mr-5.25 block size-4.25 max-[676px]:mt-3.75 rounded-[3px] border bg-size-[73%] bg-center bg-no-repeat group-hover/row:border-[#9d885c] ${state}`}></span>
    )
}
