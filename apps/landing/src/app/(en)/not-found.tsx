import { notFoundMetadata } from "@/lib/metadata";
import { NotFound } from "@/sections/not-found";

export const metadata = notFoundMetadata("en");

export default function EnglishNotFound() {
  return <NotFound locale="en" />;
}
