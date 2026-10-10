import type { DictionaryEntry, EvidenceLabel } from "./schema";

/**
 * Sample investigation packs. Each object ships with the sources a student can
 * be pointed to. The guide only ever answers from these passages.
 *
 * The site ("Site K") and its records are sample teaching material written for
 * this app, not real excavation records.
 */

export type Passage = {
  id: string;
  label: EvidenceLabel;
  text: string;
  /** Words that suggest a question is about this passage. */
  keywords: string[];
  /** What this passage contributes, shown under the answer. */
  contribution: string;
  dictionary: DictionaryEntry[];
};

export type Source = { id: string; title: string; passages: Passage[] };

export type ObjectCase = {
  id: string;
  code: string;
  /** A neutral description that does not give the identity away. */
  brief: string;
  observable: string;
  practice: boolean;
  /** Hidden from students. Used to make sure the guide never says it. */
  identity: string;
  identityTerms: string[];
  sources: Source[];
};

export const OBJECTS: ObjectCase[] = [
  {
    id: "p-001",
    code: "Practice P-001",
    brief: "A flat, round object about the size of a large coin, with a hole through the middle.",
    observable: "Fired clay disc, 4 cm across, 1 cm thick, with a 7 mm central hole.",
    practice: true,
    identity: "spindle whorl",
    identityTerms: ["spindle whorl", "whorl", "spindle", "spinning wool", "spin thread"],
    sources: [
      {
        id: "p1-card",
        title: "Find card P-001",
        passages: [
          {
            id: "p1-card-material",
            label: "fact",
            text: "The disc is fired clay. It measures 4 cm across and 1 cm thick and weighs 28 g. The central hole is 7 mm wide and smooth on the inside.",
            keywords: ["made", "material", "clay", "size", "weigh", "weight", "measure", "big", "hole", "thick", "wide"],
            contribution: "gives the material, size and weight",
            dictionary: [{ term: "fired clay", pos: "noun", definition: "clay that has been heated in a fire or kiln until it is hard." }],
          },
          {
            id: "p1-card-wear",
            label: "fact",
            text: "The inside of the hole is polished smooth, as if something was pushed through it and turned many times.",
            keywords: ["wear", "worn", "smooth", "polished", "marks", "use", "used", "inside"],
            contribution: "describes the wear inside the hole",
            dictionary: [{ term: "polished", pos: "adjective", definition: "made smooth and shiny by rubbing." }],
          },
        ],
      },
      {
        id: "p1-house",
        title: "House 2 finds list",
        passages: [
          {
            id: "p1-house-context",
            label: "record",
            text: "The disc was found on the floor of House 2, next to a pile of loom weights and a bone needle.",
            keywords: ["found", "where", "location", "house", "floor", "next", "near", "nearby", "with"],
            contribution: "records where it was found and what was next to it",
            dictionary: [{ term: "loom weight", pos: "noun", definition: "a heavy object hung from threads on an upright loom to keep them tight." }],
          },
          {
            id: "p1-house-date",
            label: "inference",
            text: "Pottery styles on the same floor suggest House 2 was lived in roughly 2,500 years ago, but the floor itself has not been directly dated.",
            keywords: ["when", "old", "age", "date", "dated", "period", "time", "years"],
            contribution: "offers an approximate date from the pottery found with it",
            dictionary: [{ term: "pottery style", pos: "noun", definition: "the shapes and decorations that potters used at a particular time and place." }],
          },
        ],
      },
    ],
  },
  {
    id: "a-014",
    code: "Object A-014",
    brief: "A metal object about 11 cm long, with one end narrower than the other.",
    observable: "Copper alloy, 11.2 cm long, green surface crust, one worn edge.",
    practice: false,
    identity: "bronze chisel",
    identityTerms: ["chisel", "woodworking tool", "carving tool"],
    sources: [
      {
        id: "a14-conservation",
        title: "Conservation report",
        passages: [
          {
            id: "a14-cons-material",
            label: "fact",
            text: "Analysis shows the object is a copper alloy with some tin. The green crust on the surface is corrosion that forms on copper-based metals over a long time. It is 11.2 cm long and weighs 96 g.",
            keywords: ["made", "material", "metal", "copper", "bronze", "green", "crust", "colour", "color", "size", "weigh", "weight", "long", "measure"],
            contribution: "gives the metal analysis, size and weight",
            dictionary: [
              { term: "alloy", pos: "noun", definition: "a metal made by mixing two or more metals together." },
              { term: "corrosion", pos: "noun", definition: "damage to metal caused by air and water over time." },
            ],
          },
          {
            id: "a14-cons-wear",
            label: "fact",
            text: "Figure 3 shows the narrow end. Its edge is flattened and slightly rounded, with fine scratches running along its length. The wide end is flattened and spread out, as if it was hit repeatedly.",
            keywords: ["wear", "worn", "edge", "end", "marks", "scratches", "shape", "use", "used", "damage", "hit", "figure"],
            contribution: "describes the wear on both ends (figure 3)",
            dictionary: [{ term: "wear pattern", pos: "noun", definition: "marks left on an object where it was rubbed, gripped or struck again and again." }],
          },
        ],
      },
      {
        id: "a14-excavation",
        title: "Excavation record, Trench 4",
        passages: [
          {
            id: "a14-exc-find",
            label: "record",
            text: "The object was found in Trench 4, layer 3, beside the remains of two small hearths. Wood shavings preserved as charcoal were found in the same layer.",
            keywords: ["found", "where", "location", "trench", "layer", "hearth", "near", "nearby", "next", "site", "with", "dig"],
            contribution: "records the find spot and what was found beside it",
            dictionary: [
              { term: "hearth", pos: "noun", definition: "a place where a fire was made, often lined with stones." },
              { term: "layer", pos: "noun", definition: "one band of soil in the ground; lower layers are usually older." },
            ],
          },
          {
            id: "a14-exc-date",
            label: "record",
            text: "Charcoal from layer 3 was radiocarbon dated to about 3,000 years ago.",
            keywords: ["when", "old", "age", "date", "dated", "period", "time", "years", "radiocarbon", "charcoal"],
            contribution: "gives the radiocarbon date for layer 3",
            dictionary: [{ term: "radiocarbon dating", pos: "noun", definition: "a way of working out how old something that was once alive is, by measuring a type of carbon in it." }],
          },
        ],
      },
      {
        id: "a14-summary",
        title: "Site summary, chapter 2",
        passages: [
          {
            id: "a14-sum-craft",
            label: "inference",
            text: "Archaeologists think this part of the site was used for small-scale metalworking and woodworking, based on slag and wood shavings found around the hearths. This is an interpretation from indirect evidence, not a certainty.",
            keywords: ["used", "for", "purpose", "hearths", "slag", "work", "activity", "happened", "area", "people", "do"],
            contribution: "offers an interpretation of what the area was used for",
            dictionary: [
              { term: "slag", pos: "noun", definition: "the glassy waste left over when metal is melted out of rock or reworked." },
              { term: "indirect evidence", pos: "noun", definition: "clues that point towards an idea without showing it directly." },
            ],
          },
          {
            id: "a14-sum-belief",
            label: "cultural",
            text: "A later local tradition says that metal objects buried near hearths were left as offerings for the household. Other scholars disagree, and this meaning may not apply to every find.",
            keywords: ["meaning", "belief", "believe", "religion", "ritual", "offering", "special", "culture", "tradition", "why", "buried"],
            contribution: "describes one cultural interpretation, which is disputed",
            dictionary: [{ term: "offering", pos: "noun", definition: "something given as a gift, often to a god or to honour someone." }],
          },
        ],
      },
    ],
  },
  {
    id: "a-015",
    code: "Object A-015",
    brief: "A small, hand-sized clay object with an open top and a short spout on one side.",
    observable: "Fired clay, 9 cm long, open bowl with a short spout, black marks around the spout.",
    practice: false,
    identity: "oil lamp",
    identityTerms: ["oil lamp", "lamp", "light", "lighting", "wick"],
    sources: [
      {
        id: "a15-card",
        title: "Find card A-015",
        passages: [
          {
            id: "a15-card-material",
            label: "fact",
            text: "The object is fired clay, 9 cm long and 3 cm high. It has a shallow open bowl and a short spout on one side.",
            keywords: ["made", "material", "clay", "size", "long", "high", "shape", "spout", "bowl", "measure"],
            contribution: "gives the material, size and shape",
            dictionary: [{ term: "spout", pos: "noun", definition: "a short tube or lip that liquid can pour out of." }],
          },
          {
            id: "a15-card-marks",
            label: "fact",
            text: "There are black sooty marks around the tip of the spout but not inside the bowl. Residue analysis found traces of plant oil in the bowl.",
            keywords: ["marks", "black", "soot", "burnt", "burned", "residue", "inside", "traces", "wear", "used", "use", "oil"],
            contribution: "describes the burn marks and the residue analysis",
            dictionary: [
              { term: "soot", pos: "noun", definition: "black powder left behind when something burns." },
              { term: "residue", pos: "noun", definition: "a small amount of something left behind after most of it is gone." },
            ],
          },
        ],
      },
      {
        id: "a15-tomb",
        title: "Excavation record, Room 6",
        passages: [
          {
            id: "a15-tomb-find",
            label: "record",
            text: "The object was found in a small niche cut into the wall of Room 6, a windowless inner room.",
            keywords: ["found", "where", "location", "room", "niche", "wall", "window", "inside", "near"],
            contribution: "records where it was found",
            dictionary: [{ term: "niche", pos: "noun", definition: "a small hollow cut into a wall, often used as a shelf." }],
          },
          {
            id: "a15-tomb-date",
            label: "inference",
            text: "Coins found on the floor of Room 6 suggest the room was in use about 1,900 years ago.",
            keywords: ["when", "old", "age", "date", "dated", "period", "time", "years", "coins"],
            contribution: "suggests a date from coins found in the same room",
            dictionary: [{ term: "context", pos: "noun", definition: "everything found around an object, which helps explain it." }],
          },
        ],
      },
    ],
  },
];

export function getObject(id: string): ObjectCase | undefined {
  return OBJECTS.find((o) => o.id === id);
}

export function findPassage(obj: ObjectCase, passageId: string): { source: Source; passage: Passage } | undefined {
  for (const source of obj.sources) {
    const passage = source.passages.find((p) => p.id === passageId);
    if (passage) return { source, passage };
  }
  return undefined;
}

export function sourceTitle(obj: ObjectCase, passageId: string): string {
  return findPassage(obj, passageId)?.source.title ?? "Source";
}
