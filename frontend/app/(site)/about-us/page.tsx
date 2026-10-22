import StaticInfoPage, { staticPageMetadata } from "@/app/components/StaticInfoPage";

export function generateMetadata() {
  return staticPageMetadata("about-us");
}

export default function Page() {
  return <StaticInfoPage slug="about-us" livePath="/about-us" />;
}
