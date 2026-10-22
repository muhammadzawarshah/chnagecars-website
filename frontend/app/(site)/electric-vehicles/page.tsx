import StaticInfoPage, { staticPageMetadata } from "@/app/components/StaticInfoPage";

export function generateMetadata() {
  return staticPageMetadata("electric-vehicles");
}

export default function Page() {
  return <StaticInfoPage slug="electric-vehicles" livePath="/electric-vehicles" />;
}
