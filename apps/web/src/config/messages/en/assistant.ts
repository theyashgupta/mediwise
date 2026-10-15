import { plural } from "../plural";
import { formatCount } from "../locales";

export const assistant = {
  askReport: "Ask about this report",
  consent:
    "I agree that the MediWise team can read my questions and answers for one month to check them.",
  title: "Ask about your reports",
  titleFor: (name: string) => `Ask about ${name}'s reports`,
  onlyReports: "Answers come only from your reports.",
  inputLabel: "Your question",
  emptyQuestion: "Write a question.",
  placeholder: "Ask a question about your reports",
  send: "Send",
  writing: "MediWise is writing the answer.",
  you: "You",
  empty: {
    title: "No questions yet",
    body: "Ask about a value, a trend or a report. Each answer names the report and the date of every number.",
  },
  off: "The assistant is not available now. Try again later.",
  loadError: "We could not load your questions.",
  left: (n: number) =>
    plural("en", n, {
      one: `${formatCount("en", n)} question left`,
      other: `${formatCount("en", n)} questions left`,
    }),
  out: {
    use_credit: "You have no questions left. Use 1 credit to get 20 more questions.",
    buy: "You have no questions left. Buy credits to ask more questions.",
    add_report: "You have no questions left. Add a report to get 5 more questions.",
    useCredit: "Use 1 credit",
    buyCredits: "Buy credits",
    addReport: "Add a report",
  },
  wrong: "Mark as wrong",
  markedWrong: "You marked this answer as wrong.",
  englishOnly: "Answers are in English.",
  menu: {
    label: "Chat options",
    clear: "Clear chat",
  },
  clearDialog: {
    title: "Clear this chat?",
    description:
      "MediWise deletes every question and answer of this profile. You cannot restore them.",
    cancel: "Cancel",
    confirm: "Clear chat",
    clearing: "Clearing",
  },
  chip: {
    episodeDeleted: "Episode deleted",
    deleted: "Report deleted",
    repeatStudy: "Repeat study",
    report: "Report",
  },
  widget: {
    open: "Open the chat",
    close: "Close the chat",
    fullPage: "Open the chat in a full page",
    thread: "Questions and answers",
  },
  fact: {
    title: "Cited value",
    hint: "Select a cited value to see it here.",
    none: "None",
    missing: "This value is not in the report now.",
    open: "Open report",
  },
};
