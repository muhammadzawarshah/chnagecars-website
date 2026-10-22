import StaticInfoPage, { staticPageMetadata } from "@/app/components/StaticInfoPage";

export function generateMetadata() {
  return staticPageMetadata("privacy-policy");
}

export default function Page() {
  return <StaticInfoPage slug="privacy-policy" livePath="/privacy_policy" />;
}
