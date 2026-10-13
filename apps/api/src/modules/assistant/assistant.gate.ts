const emergency =
  /\bchest (pain|tightness|pressure)\b|\b(can ?not|can'?t|cannot|unable to|hard to|struggling to) breathe?\b|\b(short(ness)? of|out of) breath\b|\bbreathless\b|\bfaint(ed|ing)?\b|\bpass(ed)? out\b|\bunconscious\b|\b(heavy|heavily|a lot of) bleed|\bbleeding (heavily|a lot)\b|\b(vomit|cough)(ing|ed)? (up )?blood\b|\bhaving a (heart attack|stroke)\b|\bseizure\b|\bsuicid|\bkill(ing)? myself\b|\b(hurt|hurting|harm|harming) myself\b|\bself[- ]?harm\b|\bend (it all|my life)\b/i;
const dose = /\bdos(e|es|age|ing)\b|\bhow (much|many)\b[^?.!]*\btake\b/i;

/**
 * Answers an emergency or a dose question with a fixed refusal kind before any Claude call.
 *
 * @remarks
 * The lists err to the fixed copy: a harmless question that matches gets safe text and costs nothing. An emergency wins
 * over a dose, because its copy carries the helpline numbers.
 */
export function gateQuestion(question: string): "emergency" | "treatment" | undefined {
  if (emergency.test(question)) return "emergency";
  if (dose.test(question)) return "treatment";
  return undefined;
}
