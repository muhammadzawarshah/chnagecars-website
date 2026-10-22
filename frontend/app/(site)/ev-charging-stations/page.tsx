import StaticInfoPage, { staticPageMetadata } from "@/app/components/StaticInfoPage";

export function generateMetadata() {
  return staticPageMetadata("ev-charging");
}

export default function Page() {
  return <StaticInfoPage slug="ev-charging" livePath="/ev-charging-stations" />;
}
