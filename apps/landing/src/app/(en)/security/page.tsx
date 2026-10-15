import { securityMetadata } from "@/lib/metadata";
import { Security } from "@/sections/security";

export const metadata = securityMetadata("en");

export default function SecurityPage() {
  return <Security locale="en" />;
}
