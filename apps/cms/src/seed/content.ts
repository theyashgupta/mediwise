import { randomBytes } from "node:crypto";
import type { TypedLocale } from "payload";
import { policies } from "./legal";

type LexicalNode = { type: string; version: number; [key: string]: unknown };

const securityPolicyUrl = "https://github.com/theyashgupta/mediwise/blob/main/SECURITY.md";

const element = { direction: "ltr", format: "", indent: 0, version: 1 } as const;

const text = (value: string): LexicalNode => ({
  type: "text",
  text: value,
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const paragraph = (children: LexicalNode[]): LexicalNode => ({
  ...element,
  type: "paragraph",
  textFormat: 0,
  textStyle: "",
  children,
});

const heading = (value: string, anchorId?: string): LexicalNode => ({
  ...element,
  type: "heading",
  tag: "h2",
  children: [
    ...(anchorId
      ? [
          {
            type: "inlineBlock",
            version: 1,
            fields: {
              id: randomBytes(12).toString("hex"),
              blockType: "anchor",
              blockName: "",
              anchorId,
            },
          },
        ]
      : []),
    text(value),
  ],
});

const link = (value: string, url: string): LexicalNode => ({
  ...element,
  type: "link",
  version: 3,
  fields: { url, newTab: false, linkType: "custom" },
  children: [text(value)],
});

const richText = (children: LexicalNode[]) => ({ root: { ...element, type: "root", children } });

const lines = (values: string[]) => values.map((value) => paragraph([text(value)]));

type SeedPage = {
  slug: string;
  title: string;
  description?: string;
  body: ReturnType<typeof richText>;
};
type SeedFaqItem = {
  key: string;
  order: number;
  question: string;
  answer: ReturnType<typeof richText>;
};

const landingText: Record<
  TypedLocale,
  {
    security: {
      title: string;
      description: string;
      intro: string;
      items: { title: string; body: string }[];
      report: { title: string; body: string; link: string };
    };
    faq: { key: string; question: string; answer: string[] }[];
  }
> = {
  en: {
    security: {
      title: "How MediWise protects your data",
      description:
        "The controls that protect your reports in MediWise, and how to report a vulnerability.",
      intro: "This page lists the controls that protect your reports and your account.",
      items: [
        {
          title: "Encryption",
          body: "Your data goes over an encrypted connection (TLS). Supabase encrypts the database and the files at rest.",
        },
        {
          title: "Private storage",
          body: "Your files are in private storage. Only a short-lived link from the MediWise API opens a file.",
        },
        {
          title: "No trackers",
          body: "MediWise uses no analytics, no advertising trackers and no third-party cookies.",
        },
        {
          title: "Deletion",
          body: "When you delete your account, MediWise deletes your files, your data and your sign-in. Payment records stay for tax law.",
        },
        {
          title: "Hashed share links",
          body: "A share link uses a long random code. MediWise keeps only a one-way code of it. Each link has an end date.",
        },
        {
          title: "Supply-chain scan",
          body: "On each change and each day, a scan checks the code and its packages for signs of known supply-chain worms.",
        },
      ],
      report: {
        title: "Report a vulnerability",
        body: "Do not open a public issue. Follow the steps in SECURITY.md to report the problem in private.",
        link: "Read SECURITY.md",
      },
    },
    faq: [
      {
        key: "upload",
        question: "What can I upload?",
        answer: [
          "Upload a PDF, or photos in JPG, PNG, HEIC or WebP. You can add up to {maxFiles} files in one report.",
          "Each file can be up to {fileMb} MB. All the files together can be up to {totalMb} MB.",
        ],
      },
      {
        key: "labs",
        question: "Which labs does MediWise read?",
        answer: [
          "MediWise reads reports from any lab. It matches each printed test name to the {markers} markers in its catalog.",
          "A test name that it does not know shows as not recognised.",
        ],
      },
      {
        key: "accuracy",
        question: "How accurate is it?",
        answer: [
          "An AI model copies the values from your report. Fixed rules then score them, so the same values always give the same score.",
          "Each range cites a published source, such as guidelines from ADA, KDIGO, WHO and national bodies.",
          "MediWise can misread a value. Compare each value with your printed report.",
        ],
      },
      {
        key: "diagnosis",
        question: "Is this a diagnosis?",
        answer: [
          "No. {disclaimer}",
          "Take your report and the questions from MediWise to your doctor.",
        ],
      },
      {
        key: "data",
        question: "How do you store my data?",
        answer: [
          "Your reports and results are encrypted in transit and at rest. They are private to your account.",
          "We store them on Supabase servers in Mumbai, India.",
          "To read a report, MediWise sends its pages to an AI model made by Anthropic.",
          "MediWise removes pages with identity documents, such as passports or national ID cards, when it reads your files. You can delete a report or your account at any time.",
        ],
      },
      {
        key: "refund",
        question: "Can I get a refund?",
        answer: [
          "Yes, for a credit that you did not use. Ask for the refund within 7 days of the payment.",
          "We do not refund a credit that MediWise used to read a report.",
        ],
      },
      {
        key: "family",
        question: "Can I add my family?",
        answer: [
          "Yes. Make a profile for each person, up to {maxProfiles} profiles.",
          "Each profile has its own age, sex and ancestry, so each person gets their own ranges.",
        ],
      },
    ],
  },
  hi: {
    security: {
      title: "MediWise आपके डेटा की सुरक्षा कैसे करता है",
      description:
        "MediWise में आपकी रिपोर्ट की सुरक्षा के उपाय, और सुरक्षा की कमज़ोरी की रिपोर्ट कैसे करें।",
      intro: "यह पेज उन उपायों की सूची देता है जो आपकी रिपोर्ट और आपके खाते की सुरक्षा करते हैं।",
      items: [
        {
          title: "एन्क्रिप्शन",
          body: "आपका डेटा एन्क्रिप्टेड कनेक्शन (TLS) से जाता है। Supabase डेटाबेस और फ़ाइलों को स्टोरेज में एन्क्रिप्ट करता है।",
        },
        {
          title: "प्राइवेट स्टोरेज",
          body: "आपकी फ़ाइलें प्राइवेट स्टोरेज में हैं। फ़ाइल सिर्फ़ MediWise API के कम समय वाले लिंक से खुलती है।",
        },
        {
          title: "कोई ट्रैकर नहीं",
          body: "MediWise कोई एनालिटिक्स, विज्ञापन ट्रैकर या थर्ड-पार्टी कुकी इस्तेमाल नहीं करता।",
        },
        {
          title: "डिलीट करना",
          body: "खाता डिलीट करने पर MediWise आपकी फ़ाइलें, आपका डेटा और आपका साइन-इन डिलीट करता है। टैक्स कानून के लिए पेमेंट रिकॉर्ड रहते हैं।",
        },
        {
          title: "हैश किए गए शेयर लिंक",
          body: "शेयर लिंक एक लंबे रैंडम कोड से बनता है। MediWise उसका सिर्फ़ एक-तरफ़ा कोड रखता है। हर लिंक की एक आख़िरी तारीख होती है।",
        },
        {
          title: "सप्लाई-चेन स्कैन",
          body: "हर बदलाव पर और हर दिन एक स्कैन कोड और उसके पैकेज में जाने-माने सप्लाई-चेन वर्म के निशान जाँचता है।",
        },
      ],
      report: {
        title: "सुरक्षा की कमज़ोरी की रिपोर्ट करें",
        body: "पब्लिक issue न खोलें। निजी रिपोर्ट के लिए SECURITY.md के कदम अपनाएँ।",
        link: "SECURITY.md पढ़ें",
      },
    },
    faq: [
      {
        key: "upload",
        question: "क्या-क्या अपलोड कर सकते हैं?",
        answer: [
          "PDF अपलोड करें, या JPG, PNG, HEIC या WebP में फ़ोटो। एक रिपोर्ट में {maxFiles} फ़ाइलें तक जोड़ सकते हैं।",
          "हर फ़ाइल {fileMb} MB तक हो सकती है। सभी फ़ाइलें मिलाकर {totalMb} MB तक हो सकती हैं।",
        ],
      },
      {
        key: "labs",
        question: "MediWise किन लैब की रिपोर्ट पढ़ता है?",
        answer: [
          "MediWise किसी भी लैब की रिपोर्ट पढ़ता है। यह हर छपे टेस्ट के नाम को अपने कैटलॉग के {markers} मार्कर से मिलाता है।",
          "जिस टेस्ट का नाम यह नहीं पहचानता, वह “पहचाना नहीं गया” दिखता है।",
        ],
      },
      {
        key: "accuracy",
        question: "यह कितना सही है?",
        answer: [
          "एक AI मॉडल आपकी रिपोर्ट से मान कॉपी करता है। फिर तय नियम उन्हें स्कोर करते हैं, इसलिए एक जैसे मानों पर हमेशा एक जैसा स्कोर आता है।",
          "हर रेंज किसी प्रकाशित स्रोत पर आधारित है, जैसे ADA, KDIGO, WHO और राष्ट्रीय संस्थाओं की गाइडलाइन।",
          "MediWise कोई मान गलत पढ़ सकता है। हर मान को अपनी छपी हुई रिपोर्ट से मिलाएँ।",
        ],
      },
      {
        key: "diagnosis",
        question: "क्या यह निदान है?",
        answer: [
          "नहीं। {disclaimer}",
          "अपनी रिपोर्ट और MediWise के सवाल अपने डॉक्टर के पास ले जाएँ।",
        ],
      },
      {
        key: "data",
        question: "आप मेरा डेटा कैसे रखते हैं?",
        answer: [
          "आपकी रिपोर्ट और नतीजे ट्रांज़िट और स्टोरेज, दोनों में एन्क्रिप्टेड रहते हैं। ये सिर्फ़ आपके खाते तक सीमित हैं।",
          "हम इन्हें मुंबई, भारत के Supabase सर्वर पर रखते हैं।",
          "रिपोर्ट पढ़ने के लिए MediWise उसके पेज Anthropic के बनाए एक AI मॉडल को भेजता है।",
          "MediWise आपकी फ़ाइलें पढ़ते समय पहचान दस्तावेज़ वाले पेज हटा देता है, जैसे पासपोर्ट या राष्ट्रीय पहचान पत्र। आप कभी भी कोई रिपोर्ट या अपना खाता हटा सकते हैं।",
        ],
      },
      {
        key: "refund",
        question: "क्या रिफ़ंड मिल सकता है?",
        answer: [
          "हाँ, उस क्रेडिट का, जिसका आपने इस्तेमाल नहीं किया। पेमेंट के 7 दिन के अंदर रिफ़ंड माँगें।",
          "MediWise ने जिस क्रेडिट से रिपोर्ट पढ़ी, उसका रिफ़ंड नहीं मिलता।",
        ],
      },
      {
        key: "family",
        question: "क्या परिवार के लोगों को जोड़ सकते हैं?",
        answer: [
          "हाँ। हर व्यक्ति के लिए एक प्रोफ़ाइल बनाएँ, {maxProfiles} प्रोफ़ाइल तक।",
          "हर प्रोफ़ाइल में व्यक्ति की उम्र, लिंग और वंश होते हैं, इसलिए हर व्यक्ति को अपनी रेंज मिलती है।",
        ],
      },
    ],
  },
};

/**
 * Builds the five pages for one locale from the legal source text and the security page text.
 *
 * @remarks
 * The policies exist in English only, so Hindi gets the security page alone and the rest falls back to English.
 */
export function seedPages(locale: TypedLocale): SeedPage[] {
  const security = landingText[locale].security;
  const securityPage: SeedPage = {
    slug: "security",
    title: security.title,
    description: security.description,
    body: richText([
      ...lines([security.intro]),
      ...security.items.flatMap((item) => [heading(item.title), ...lines([item.body])]),
      heading(security.report.title),
      ...lines([security.report.body]),
      paragraph([link(security.report.link, securityPolicyUrl)]),
    ]),
  };
  if (locale === "hi") return [securityPage];
  const legal = Object.entries(policies).map(([slug, policy]) => ({
    slug,
    title: policy.title,
    body: richText(
      policy.sections.flatMap((section) => [
        heading(section.heading, section.id),
        ...lines(section.body),
      ]),
    ),
  }));
  return [...legal, securityPage];
}

/**
 * Builds the FAQ items for one locale in landing order, with tokens in place of the numbers from the code.
 */
export function seedFaq(locale: TypedLocale): SeedFaqItem[] {
  return landingText[locale].faq.map((item, index) => ({
    key: item.key,
    order: index + 1,
    question: item.question,
    answer: richText(lines(item.answer)),
  }));
}
