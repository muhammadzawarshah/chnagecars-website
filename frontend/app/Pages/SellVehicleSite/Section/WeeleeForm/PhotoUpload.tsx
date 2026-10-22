"use client"

import { useEffect, useState } from "react"
import { pickedPhotos } from "../../../../lib/backend/pickedPhotos"

// "Upload Now" dropzone of the WeeLee form.
export default function PhotoUpload() {

    const [count, setCount] = useState(0);

    // A fresh dropzone starts with no photos.
    useEffect(() => pickedPhotos.clear(), []);

    return (
        <>
            <div className="mb-2.5">
                <div className="-mx-3 flex flex-wrap">
                    <div className="mt-4 w-full shrink-0 px-3">
                        <div className="mb-2 text-black">
                            <span>We need photos from the front, left, rear and right, as well as the dashboard (switched on), vehicle interior and engine.</span> <em>(max image size 10 MB)</em>
                        </div>
                    </div>
                </div>
                <div className="-mx-3 flex flex-wrap">
                    <div className="mt-4 w-full shrink-0 px-3">
                        <label
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => { event.preventDefault(); pickedPhotos.add(event.dataTransfer.files); setCount(count + event.dataTransfer.files.length); }}
                            className="flex cursor-pointer flex-col items-center justify-center rounded-[10px] bg-[#d9d9d9] p-6 text-black @min-[768px]:p-12"
                        >
                            <input type="file" multiple accept="image/*" onChange={(event) => { pickedPhotos.add(event.target.files); setCount(count + (event.target.files?.length ?? 0)); }} className="hidden" />
                            <span className="flex flex-col items-center justify-center bg-[#d9d9d9]">
                                <span>Drag &amp; Drop the desired files <br />…or click to browse for files instead.</span>
                                {count > 0 && <span>{count} file{count > 1 ? "s" : ""} selected</span>}
                            </span>
                        </label>
                    </div>
                </div>
                <div className="-mx-3 flex flex-wrap">
                    <div className="mt-4 w-full shrink-0 px-3"></div>
                </div>
            </div>
        </>
    )
}
