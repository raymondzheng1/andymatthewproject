import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Highlight } from "@/components/highlight";
import { checkOriginality } from "@/lib/insights";
import { emptyLog } from "@/lib/store";

describe("Highlight", () => {
  it("marks exactly the stretches the originality check found, including hyphenated words and numbers", () => {
    const chat = "Archaeologists think this part of the site was used for small-scale metalworking, about 3,000 years ago.";
    const reasoning = "My view: archaeologists think this part of the site was used for small-scale metalworking, about 3,000 years ago. The edge is worn.";
    const o = checkOriginality({ ...emptyLog(), reasoning }, [chat]);
    expect(o.matches.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(<Highlight text={reasoning} matches={o.matches} />);
    expect(html).toContain("<mark>archaeologists think this part of the site was used for small-scale metalworking, about 3,000 years ago.</mark>");
    expect(html).not.toContain("<mark>My");
    expect(html).toContain("The edge is worn.");
  });

  it("leaves text untouched when nothing matches", () => {
    expect(renderToStaticMarkup(<Highlight text="All my own words." matches={[]} />)).toBe("<span>All my own words.</span>");
  });
});
