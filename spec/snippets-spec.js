const snippets = require("../snippets/main.json");

describe("Ruby on Rails snippets", () => {
  it("makes Rails DSL snippets available in canonical Ruby scopes", () => {
    const rubySelectors = Object.keys(snippets).filter(
      (selector) => selector.includes("meta.rails") || selector.includes("source.ruby.rails"),
    );

    expect(rubySelectors.length).toBeGreaterThan(0);
    for (const selector of rubySelectors) expect(selector).toContain(".source.ruby");
  });

  it("targets the surviving ERB roots", () => {
    const selectors = Object.keys(snippets).join(" ");
    expect(selectors).toContain(".text.html.erb");
    expect(selectors).toContain(".source.js.rails");
    expect(selectors).toContain(".source.sql.ruby");
  });

  it("retains representative Rails and ERB snippets", () => {
    const names = Object.values(snippets).flatMap((group) => Object.keys(group));
    expect(names).toContain("Rails.logger.debug");
    expect(names).toContain("resources");
    expect(names).toContain("erb_render_block");
  });
});
