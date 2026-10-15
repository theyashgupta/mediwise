type SuggestionDisclaimerProps = {
  text: string;
};

export function SuggestionDisclaimer({ text }: SuggestionDisclaimerProps) {
  return (
    <p data-testid="suggestion-disclaimer" className="text-sm text-muted-foreground">
      {text}
    </p>
  );
}
