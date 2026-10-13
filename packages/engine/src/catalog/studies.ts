import { range } from "./range.js";
import type { Marker } from "./schema.js";
import { sources } from "./sources.js";

const {
  ahaHeartRate,
  bowie2000,
  chow2016,
  drew2010,
  emamian1993,
  hancock2009,
  kratzer2003,
  kusumoto2019,
  rautaharju2009,
  surawicz2009,
  weinreb1982,
} = sources;

type StudyMarker = Omit<Marker, "category" | "core" | "aliases" | "conversions"> &
  Partial<Pick<Marker, "aliases" | "conversions">>;

/**
 * Fills the fields every study measurement shares, so each entry lists only what is its own.
 *
 * @remarks
 * A study measurement takes a status where a guideline gives a range, and never counts in the score.
 */
function study(entry: StudyMarker): Marker {
  return { aliases: [], conversions: [], ...entry, category: "studies", core: false };
}

/** Builds an ECG interval measured in milliseconds. */
function ms(key: string, name: string, copy: Omit<StudyMarker, "key" | "name" | "unit">) {
  return study({ key, name, unit: "ms", ...copy });
}

/** Builds one of the three ECG axes, which share their copy. */
function axis(key: string, name: string, chambers: string) {
  return study({
    key,
    name,
    unit: "°",
    conversions: [
      { from: "deg", factor: 1 },
      { from: "degrees", factor: 1 },
    ],
    precision: 0,
    description: `The main direction of the electrical signal in the ${chambers}.`,
    whatItIs:
      "An axis is the average direction of the heart's electrical signal. The ECG machine prints it in degrees.",
    whyItMatters:
      "An unusual axis can point to a change in the heart's wiring or shape. Your doctor reads it with the full ECG.",
    whatMovesIt:
      "Body shape, age and heart conditions change the axis. It stays about the same from year to year.",
    ranges: [],
    sources: [surawicz2009],
    direction: "both",
  });
}

/** Builds the length of one kidney, which both sides share. */
function kidney(side: "right" | "left") {
  return study({
    key: `${side}_kidney_length`,
    name: `${side === "right" ? "Right" : "Left"} kidney length`,
    unit: "mm",
    conversions: [{ from: "cm", factor: 10 }],
    precision: 0,
    description: `The length of your ${side} kidney on the ultrasound.`,
    whatItIs:
      "The radiologist measures the kidney from end to end on the ultrasound screen. MediWise copies the value from the printed report.",
    whyItMatters:
      "A small kidney can be a sign of long-term kidney disease. A study of 665 adults found a middle length of about 11 cm.",
    whatMovesIt:
      "Kidneys become a little smaller with age. Long-term kidney disease makes them smaller, and a blocked kidney can become larger.",
    ranges: [],
    sources: [emamian1993],
    direction: "both",
  });
}

export const studyMarkers: Marker[] = [
  study({
    key: "heart_rate",
    name: "Heart rate on the ECG",
    shortName: "Heart rate",
    aliases: ["hr", "ventricular rate", "vent rate"],
    unit: "bpm",
    conversions: [
      { from: "/min", factor: 1 },
      { from: "/bpm", factor: 1 },
      { from: "beats/min", factor: 1 },
    ],
    precision: 0,
    description: "How many times your heart beat in one minute during the ECG.",
    whatItIs:
      "The ECG machine counts your heartbeats during the recording. It prints the result in beats a minute.",
    whyItMatters:
      "A resting adult heart rate is usually 60 to 100 beats a minute. A rate outside this range needs a doctor's check.",
    whatMovesIt:
      "Exercise, stress, caffeine and fever raise it. Physical fitness and some heart medicines lower it.",
    ranges: [range(ahaHeartRate, [60, 100], [50, 110])],
    sources: [ahaHeartRate],
    direction: "both",
  }),
  ms("rr_interval", "RR interval", {
    aliases: ["rr"],
    precision: 0,
    description: "The time between two heartbeats on the ECG.",
    whatItIs:
      "The RR interval is the time from one heartbeat to the next. The ECG machine measures it in milliseconds.",
    whyItMatters:
      "It is the heart rate shown as a time. A longer interval means a slower heart rate.",
    whatMovesIt:
      "Anything that changes the heart rate changes it. Exercise and stress make it shorter.",
    ranges: [],
    sources: [rautaharju2009],
    direction: "both",
  }),
  ms("p_duration", "P wave duration", {
    aliases: ["p", "p wave"],
    precision: 0,
    description: "How long the upper chambers of the heart take to activate.",
    whatItIs:
      "The P wave shows the electrical signal of the atria, the upper chambers of the heart. The ECG machine measures its length in milliseconds.",
    whyItMatters:
      "A long P wave can show a large or strained atrium. Your doctor reads it with the full ECG.",
    whatMovesIt:
      "High blood pressure and heart valve disease can make it longer. It changes slowly over years.",
    ranges: [],
    sources: [hancock2009],
    direction: "both",
  }),
  ms("pr_interval", "PR interval", {
    aliases: ["pr", "pq interval"],
    precision: 0,
    description: "The time the heartbeat signal takes to pass from the atria to the ventricles.",
    whatItIs:
      "The PR interval starts at the P wave and stops at the QRS complex. It shows how the signal passes from the upper to the lower chambers.",
    whyItMatters:
      "A long PR interval can show a slow signal between the chambers. Your doctor reads it with the full ECG.",
    whatMovesIt:
      "Some heart medicines, high fitness and disease of the heart's wiring make it longer. It changes little from day to day.",
    ranges: [],
    sources: [kusumoto2019],
    direction: "both",
  }),
  ms("qrs_duration", "QRS duration", {
    aliases: ["qrs"],
    precision: 0,
    description: "How long the lower chambers of the heart take to activate.",
    whatItIs:
      "The QRS complex shows the electrical signal of the ventricles, the main pumping chambers. The ECG machine measures its length in milliseconds.",
    whyItMatters:
      "A wide QRS can show a block in the heart's wiring. Your doctor reads it with the full ECG.",
    whatMovesIt:
      "Disease of the heart's wiring, some heart medicines and high potassium can make it wider. It does not change from day to day.",
    ranges: [],
    sources: [surawicz2009],
    direction: "high_is_bad",
  }),
  ms("qt_interval", "QT interval", {
    aliases: ["qt"],
    precision: 0,
    description: "The time the lower chambers take to activate and recover.",
    whatItIs:
      "The QT interval starts at the QRS complex and stops at the end of the T wave. It changes with the heart rate.",
    whyItMatters:
      "The QT interval alone is hard to judge, because it changes with the heart rate. Doctors use the corrected value, QTc.",
    whatMovesIt:
      "A slow heart rate makes it longer. Some medicines and low potassium or magnesium also make it longer.",
    ranges: [],
    sources: [rautaharju2009],
    direction: "high_is_bad",
  }),
  ms("qtc_interval", "QTc interval", {
    shortName: "QTc",
    aliases: ["qtc", "corrected qt", "qtc bazett"],
    precision: 0,
    description: "The QT interval corrected for the heart rate.",
    whatItIs:
      "QTc is the QT interval adjusted to a heart rate of 60 beats a minute. The ECG machine calculates it with a formula such as Bazett.",
    whyItMatters:
      "A long QTc increases the risk of a dangerous heart rhythm. The AHA calls 450 ms or more long in men and 460 ms or more in women.",
    whatMovesIt:
      "Some medicines, low potassium or magnesium and some inherited conditions make it longer. Tell your doctor which medicines you take.",
    ranges: [
      range(rautaharju2009, [null, 449], [null, 499], { sex: "male" }),
      range(rautaharju2009, [null, 459], [null, 499], { sex: "female" }),
    ],
    sources: [rautaharju2009, drew2010],
    direction: "high_is_bad",
  }),
  axis("p_axis", "P axis", "upper chambers"),
  axis("qrs_axis", "QRS axis", "lower chambers"),
  axis("t_axis", "T axis", "recovery of the lower chambers"),
  study({
    key: "sokolow_lyon",
    name: "Sokolow-Lyon voltage",
    aliases: ["sokolow", "sokolow lyon index"],
    unit: "mV",
    precision: 2,
    description: "A voltage sum from the ECG that screens for a thick heart wall.",
    whatItIs:
      "The Sokolow-Lyon index adds the size of two ECG waves. The ECG machine prints it in millivolts.",
    whyItMatters:
      "A high value can point to a thick left heart wall. An ECG alone cannot confirm this, so doctors use an ultrasound of the heart.",
    whatMovesIt:
      "Long-term high blood pressure can make the heart wall thicker. Young, thin and fit people often have higher values.",
    ranges: [],
    sources: [hancock2009],
    direction: "high_is_bad",
  }),
  study({
    key: "liver_length",
    name: "Liver length",
    aliases: ["liver span", "liver size"],
    unit: "cm",
    conversions: [{ from: "mm", factor: 0.1 }],
    precision: 1,
    description: "The length of your liver on the ultrasound.",
    whatItIs:
      "The radiologist measures the liver length on the ultrasound screen. MediWise copies the value from the printed report.",
    whyItMatters:
      "A large liver can be a sign of fatty liver or other liver disease. A survey of 2080 adults found most livers 16 cm or shorter.",
    whatMovesIt:
      "Fatty liver, alcohol and some infections can make the liver larger. Body size and sex also change the normal length.",
    ranges: [range(kratzer2003, [null, 16], [null, 17.4])],
    sources: [kratzer2003],
    direction: "high_is_bad",
  }),
  study({
    key: "spleen_length",
    name: "Spleen length",
    aliases: ["spleen size"],
    unit: "cm",
    conversions: [{ from: "mm", factor: 0.1 }],
    precision: 1,
    description: "The length of your spleen on the ultrasound.",
    whatItIs:
      "The radiologist measures the spleen from end to end on the ultrasound screen. MediWise copies the value from the printed report.",
    whyItMatters:
      "A large spleen can be a sign of infection, liver disease or a blood disorder. The normal length changes with height and sex, so MediWise gives it no status.",
    whatMovesIt:
      "Infections, liver disease and some blood disorders can make the spleen larger. Tall people and men often have a slightly longer spleen.",
    ranges: [],
    sources: [chow2016],
    direction: "high_is_bad",
  }),
  kidney("right"),
  kidney("left"),
  study({
    key: "portal_vein_diameter",
    name: "Portal vein diameter",
    aliases: ["portal vein", "pv"],
    unit: "mm",
    conversions: [{ from: "cm", factor: 10 }],
    precision: 1,
    description: "The width of the main vein that carries blood to the liver.",
    whatItIs:
      "The portal vein carries blood from the gut to the liver. The radiologist measures its width on the ultrasound.",
    whyItMatters:
      "A wide portal vein can be a sign of high pressure in the liver. Your doctor reads it with the full report.",
    whatMovesIt:
      "Liver scarring can make it wider. A meal and deep breathing can change it a little during the scan.",
    ranges: [],
    sources: [weinreb1982],
    direction: "high_is_bad",
  }),
  study({
    key: "cbd_diameter",
    name: "Common bile duct diameter",
    shortName: "CBD",
    aliases: ["cbd", "common bile duct"],
    unit: "mm",
    conversions: [{ from: "cm", factor: 10 }],
    precision: 1,
    description: "The width of the tube that carries bile from the liver.",
    whatItIs:
      "The common bile duct carries bile from the liver and gallbladder to the gut. The radiologist measures its width on the ultrasound.",
    whyItMatters:
      "A wide duct can be a sign of a block, such as a stone. Your doctor reads it with the full report.",
    whatMovesIt:
      "Gallstones and some other blocks make it wider. It also becomes a little wider with age and after gallbladder surgery.",
    ranges: [],
    sources: [bowie2000],
    direction: "high_is_bad",
  }),
];
