import { Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { PageHeader } from "@/common/components/page-header";
import { ProblemError } from "@/common/utils/problem-error";
import { Button } from "@/components/ui/button";
import { creditsLeftLabel } from "@/modules/credits";
import { useMe } from "@/modules/me";
import { ProfileSwitcherContainer, useActiveProfile } from "@/modules/profiles";
import { DropZone } from "../components/drop-zone";
import { FilePreviewList } from "../components/file-preview-list";
import { sharedFilesLine } from "../config/shared-files";
import { usePhotoFlags } from "../hooks/use-photo-flags";
import { useSelectedFiles } from "../hooks/use-selected-files";
import { useSharedFiles } from "../hooks/use-shared-files";
import { useUploadReport } from "../hooks/use-upload-report";

export function UploadReportContainer() {
  const navigate = useNavigate();
  const { profile } = useActiveProfile();
  const me = useMe();
  const selected = useSelectedFiles();
  const photoFlags = usePhotoFlags(selected.files);
  const sharedCount = useSharedFiles(selected.add);
  const { upload, progress } = useUploadReport();
  const uploading = upload.isPending;
  const messages = upload.error ? [...selected.errors, upload.error.message] : selected.errors;

  function submit() {
    if (!profile) return;
    upload.mutate(
      { profileId: profile.id, files: selected.files },
      {
        onSuccess: (id) => navigate({ to: "/reports/$reportId", params: { reportId: id } }),
        onError: (error) => {
          if (error instanceof ProblemError && error.status === 402)
            void navigate({ to: "/credits" });
        },
      },
    );
  }

  return (
    <>
      <PageHeader
        title="Upload a report"
        description="We read every marker and explain it in plain English."
      />
      <div className="max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">This report is for</span>
          <ProfileSwitcherContainer placement="inline" />
        </div>
        <DropZone
          disabled={uploading}
          onFiles={(files) => {
            upload.reset();
            selected.add(files);
          }}
        />
        {sharedCount > 0 && selected.files.length > 0 && (
          <p role="status" className="text-sm">
            {sharedFilesLine(sharedCount)}
          </p>
        )}
        {selected.files.length > 0 && (
          <FilePreviewList
            files={selected.files}
            progress={progress}
            photoFlags={photoFlags}
            uploading={uploading}
            onRemove={(index) => {
              upload.reset();
              selected.remove(index);
            }}
          />
        )}
        {messages.length > 0 && (
          <ul
            role="alert"
            className="space-y-1 rounded-xl border bg-card p-4 text-sm text-destructive"
          >
            {messages.map((message) => (
              <li key={message} className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {message}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            size="lg"
            data-testid="upload-submit"
            onClick={submit}
            disabled={
              !profile || selected.files.length === 0 || selected.errors.length > 0 || uploading
            }
          >
            {uploading && <LoaderCircle className="animate-spin" aria-hidden />}
            {uploading ? "Uploading" : "Read my report"}
          </Button>
          {me.data && (
            <Link to="/credits" className="text-sm text-muted-foreground hover:underline">
              {creditsLeftLabel(me.data.credits)}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
