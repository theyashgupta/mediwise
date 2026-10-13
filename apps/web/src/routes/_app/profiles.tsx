import { createFileRoute } from "@tanstack/react-router";
import { ProfilesContainer } from "@/modules/profiles";

export const Route = createFileRoute("/_app/profiles")({ component: ProfilesContainer });
