import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { useState } from "react";
import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/common/components/controls/button";
import { Field } from "@/common/components/controls/field";
import { Input } from "@/common/components/controls/input";
import { Select, SelectItem } from "@/common/components/controls/select";
import type { EpisodeItem } from "../types";

type ReportEpisodeProps = {
  current: EpisodeItem | undefined;
  episodes: EpisodeItem[];
  busy: boolean;
  failed: boolean;
  onAdd: (episodeId: string) => void;
  onCreate: (name: string) => void;
  onRemove: () => void;
};

const newEpisode = "new";

export function ReportEpisode({
  current,
  episodes,
  busy,
  failed,
  onAdd,
  onCreate,
  onRemove,
}: ReportEpisodeProps) {
  const t = useT().episodes;
  const text = t.report;
  const [choice, setChoice] = useState(episodes[0]?.id ?? newEpisode);
  const [name, setName] = useState("");
  const creating = choice === newEpisode;

  return (
    <Section
      id="report-episode"
      title={text.title}
      description={current ? undefined : text.description}
    >
      {current ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <p className="flex flex-wrap items-center gap-2">
            <Layers className="size-4 text-primary" aria-hidden />
            {text.partOf}{" "}
            <Link
              to="/episodes/$episodeId"
              params={{ episodeId: current.id }}
              className="font-medium underline-offset-4 hover:underline"
            >
              {current.name}
            </Link>
          </p>
          <Button size="sm" variant="outline" disabled={busy} onClick={onRemove}>
            {text.remove}
          </Button>
        </div>
      ) : (
        <form
          className="grid gap-3 sm:flex sm:flex-wrap sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (creating) onCreate(name.trim());
            else onAdd(choice);
          }}
        >
          <Field label={text.episode}>
            <Select
              id="report-episode-choice"
              value={choice}
              onValueChange={setChoice}
              className="w-full sm:w-64"
            >
              {episodes.map((episode) => (
                <SelectItem key={episode.id} value={episode.id}>
                  {episode.name}
                </SelectItem>
              ))}
              <SelectItem value={newEpisode}>{text.newEpisode}</SelectItem>
            </Select>
          </Field>
          {creating && (
            <Field label={t.fields.name}>
              <Input
                id="report-episode-name"
                value={name}
                required
                maxLength={80}
                placeholder={t.fields.namePlaceholder}
                className="w-full sm:w-64"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
          )}
          <Button
            type="submit"
            variant="outline"
            className="justify-self-start"
            disabled={busy || (creating && !name.trim())}
          >
            {busy ? text.adding : text.add}
          </Button>
        </form>
      )}
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {text.failed}
        </p>
      )}
    </Section>
  );
}
