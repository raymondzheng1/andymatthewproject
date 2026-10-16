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
    id: "p-002",
    code: "Practice P-002",
    brief: "A heavy, flat stone about the length of a forearm, with a smooth, shallow dip worn into its top.",
    observable: "Sandstone slab, 42 cm long, 22 cm wide, 9 kg, with a smooth hollow on the upper face.",
    practice: true,
    identity: "saddle quern",
    identityTerms: ["quern", "grinding stone", "grindstone", "grinder", "millstone", "grind grain", "grinding grain", "grinding flour", "make flour"],
    sources: [
      {
        id: "p2-card",
        title: "Find card P-002",
        passages: [
          {
            id: "p2-card-material",
            label: "fact",
            text: "The object is sandstone, a rough, gritty stone. It is 42 cm long, 22 cm wide and weighs 9 kg.",
            keywords: ["made", "material", "stone", "rock", "size", "weigh", "weight", "heavy", "long", "measure", "big"],
            contribution: "gives the material, size and weight",
            dictionary: [{ term: "sandstone", pos: "noun", definition: "rock made of grains of sand pressed together over a very long time." }],
          },
          {
            id: "p2-card-wear",
            label: "fact",
            text: "The top has a long, shallow hollow that is much smoother than the rest of the stone. Fine scratches in the hollow run back and forth along its length.",
            keywords: ["wear", "worn", "smooth", "hollow", "dip", "top", "marks", "scratches", "use", "used", "surface"],
            contribution: "describes the smooth hollow and the scratches in it",
            dictionary: [{ term: "abrasion", pos: "noun", definition: "wearing something away by rubbing it." }],
          },
        ],
      },
      {
        id: "p2-hut",
        title: "Hut 5 excavation notes",
        passages: [
          {
            id: "p2-hut-context",
            label: "record",
            text: "It was found just inside the doorway of Hut 5, next to a smaller rounded stone that fits the hand. Charred barley grains were found in the soil around both stones.",
            keywords: ["found", "where", "location", "hut", "doorway", "next", "near", "nearby", "with", "soil", "barley", "grains"],
            contribution: "records where it was found and what was beside it",
            dictionary: [{ term: "charred", pos: "adjective", definition: "partly burnt and turned black." }],
          },
          {
            id: "p2-hut-date",
            label: "inference",
            text: "Archaeologists think Hut 5 is around 5,000 years old, because the pottery in it matches styles from early farming villages nearby. The hut itself has not been directly dated.",
            keywords: ["when", "old", "age", "date", "dated", "period", "time", "years", "pottery", "farming"],
            contribution: "suggests an age from the pottery styles",
            dictionary: [{ term: "farming village", pos: "noun", definition: "a small settlement where people grew crops and kept animals." }],
          },
        ],
      },
    ],
  },
  {
    id: "p-003",
    code: "Practice P-003",
    brief: "A small piece of bent metal wire about the length of a finger, with a coil at one end and a hook at the other.",
    observable: "Copper alloy, 6.5 cm long, curved bow with a coiled spring, a straight pin and a hooked catch.",
    practice: true,
    identity: "fibula (brooch)",
    identityTerms: ["fibula", "brooch", "safety pin", "cloak pin", "clasp", "fasten clothing", "fastening clothes", "fasten a cloak"],
    sources: [
      {
        id: "p3-cons",
        title: "Conservation notes P-003",
        passages: [
          {
            id: "p3-cons-material",
            label: "fact",
            text: "It is a copper alloy, 6.5 cm long. One end is wound into a tight coil that still springs back when gently pressed. A straight, pointed length of wire runs from the coil to a hook on the other end.",
            keywords: ["made", "material", "metal", "copper", "size", "long", "measure", "coil", "spring", "wire", "point", "pointed", "shape", "hook"],
            contribution: "gives the material, size and how the parts are shaped",
            dictionary: [{ term: "coil", pos: "noun", definition: "a wire wound round and round in rings." }],
          },
          {
            id: "p3-cons-traces",
            label: "fact",
            text: "Tiny fibres of wool were found stuck in the corrosion near the point, and the curved part is decorated with lines cut into the metal.",
            keywords: ["fibres", "fibers", "wool", "traces", "marks", "decorated", "decoration", "lines", "pattern", "used", "use", "wear"],
            contribution: "describes the wool fibres and the decoration",
            dictionary: [{ term: "fibre", pos: "noun", definition: "a very thin thread, like a single hair of wool." }],
          },
        ],
      },
      {
        id: "p3-grave",
        title: "Burial record, Grave 12",
        passages: [
          {
            id: "p3-grave-context",
            label: "record",
            text: "It was found in Grave 12 on the left shoulder of the person buried there. A second, matching one was found on the right shoulder.",
            keywords: ["found", "where", "location", "grave", "burial", "buried", "shoulder", "body", "person", "next", "near", "pair", "matching"],
            contribution: "records exactly where it was found on the body",
            dictionary: [{ term: "burial", pos: "noun", definition: "the act of putting a dead person in a grave, or the grave itself." }],
          },
          {
            id: "p3-grave-meaning",
            label: "cultural",
            text: "In some later traditions from this region, matching pairs of metal ornaments were seen as a sign of a person's family status. Scholars debate whether that meaning applied this early.",
            keywords: ["meaning", "status", "rich", "important", "belief", "culture", "tradition", "why", "special", "family", "decorated"],
            contribution: "describes one possible cultural meaning, which is debated",
            dictionary: [{ term: "status", pos: "noun", definition: "how important or respected someone is in a group." }],
          },
          {
            id: "p3-grave-date",
            label: "record",
            text: "A coin found in the same grave dates the burial to about 2,300 years ago.",
            keywords: ["when", "old", "age", "date", "dated", "period", "time", "years", "coin"],
            contribution: "dates the burial from a coin in the grave",
            dictionary: [{ term: "date (verb)", pos: "verb", definition: "to work out how old something is." }],
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
