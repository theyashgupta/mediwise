import { notFoundMetadata } from "@/lib/metadata";
import { NotFound } from "@/sections/not-found";

export const metadata = notFoundMetadata("hi");

export default function HindiNotFound() {
  return <NotFound locale="hi" />;
}
