import SiteLayout from "./(site)/layout"
import SiteNotFound from "./(site)/not-found"

// Addresses that match no route at all get the same page, with the site's header and footer.
export default function NotFound() {
    return (
        <SiteLayout params={Promise.resolve({})}>
            <SiteNotFound />
        </SiteLayout>
    )
}
