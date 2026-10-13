import { createFileRoute } from "@tanstack/react-router";
import { SettingsContainer } from "@/modules/settings";

export const Route = createFileRoute("/_app/settings")({ component: SettingsContainer });
