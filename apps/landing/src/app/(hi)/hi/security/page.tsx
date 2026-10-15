import { securityMetadata } from "@/lib/metadata";
import { Security } from "@/sections/security";

export const metadata = securityMetadata("hi");

export default function HindiSecurityPage() {
  return <Security locale="hi" />;
}
