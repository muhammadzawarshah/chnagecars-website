import StaticInfoPage, { staticPageMetadata } from "@/app/components/StaticInfoPage";

export function generateMetadata() {
  return staticPageMetadata("terms-and-conditions");
}

export default function Page() {
  return <StaticInfoPage slug="terms-and-conditions" livePath="/terms-and-conditions" />;
}
