import StaticInfoPage, { staticPageMetadata } from "@/app/components/StaticInfoPage";

export function generateMetadata() {
  return staticPageMetadata("insurance");
}

export default function Page() {
  return <StaticInfoPage slug="insurance" livePath="/insurance/discovery-car-insurance" />;
}
