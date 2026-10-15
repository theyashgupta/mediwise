const emergency =
  /\bchest (pain|tightness|pressure)\b|\bpain in (my|the) chest\b|\b(can ?not|can't|cant|unable to|hard to|struggling to|trouble|difficulty) (breathe|breathing)\b|\b(short(ness)? of|out of|catch my) breath\b|\bbreathless\b|\b(i|i've|i have|just) (fainted|passed out|collapsed)\b|\bfeel(ing)? faint\b|\bfainting\b|\bunconscious\b|\b(heavy|heavily|a lot of) bleed|\bbleeding (heavily|a lot)\b|\b(vomit|cough)(ing|ed)? (up )?blood\b|\bhaving a (heart attack|stroke)\b|\bseizure\b|\boverdos|\bsuicid|\bkill(ing)? myself\b|\b(hurt|hurting|harm|harming) myself\b|\bself[- ]?harm\b|\bend (it all|my life)\b|\b(want|wanna|going) to die\b|\bdon't want to live\b/i;
const dose =
  /\bdos(e|es|age|ing)\b|\bhow (much|many)\b[^?.!]*\b(take|mg|mcg|ug|ml|iu|units?|tablets?|capsules?|drops?)\b(?!\s*\/)|\b\d+\s*(mg|mcg|ug|iu)\b(?!\s*\/)/i;

/**
 * Answers an emergency or a dose question with a fixed refusal kind before any Claude call.
 *
 * @remarks
 * An emergency wins over a dose because its copy carries the helpline numbers.
 */
export function gateQuestion(question: string): "emergency" | "treatment" | undefined {
  const text = question
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
  if (emergency.test(text)) return "emergency";
  if (dose.test(text)) return "treatment";
  return undefined;
}
