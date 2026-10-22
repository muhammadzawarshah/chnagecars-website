// Photos picked or dropped in the sell form's dropzone, kept until the form is submitted.
// The dropzone only shows a count, and dropped files never reach its file input, so the
// files themselves are held here for the upload after the enquiry is created.

let photos: File[] = []

export const pickedPhotos = {
    add(files: FileList | File[] | null | undefined) {
        if (files) photos = [...photos, ...Array.from(files)]
    },
    all() {
        return photos
    },
    clear() {
        photos = []
    },
}
