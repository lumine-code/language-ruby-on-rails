const fs = require("fs");
const path = require("path");

// The fixtures beside this file are plain samples — the files to open when you
// want to look at the highlighting rather than assert on it.
//
// They also record something worth knowing: for its two headline file types
// this package's grammars do not win. `.rb` scores 2.01 for both
// `source.ruby` and `source.ruby.rails`, and `.html.erb` scores 8.01 for both
// `text.html.erb` and `text.html.ruby` — exact ties, which selectGrammar
// resolves by enumeration order, and language-ruby comes first. Turning
// Tree-sitter on only widens the gap, since it adds 0.1 to the plain grammars
// and this package has none. The Rails grammars are reached today only for the
// file types language-ruby does not also claim, such as `.rxml`.
//
// Nothing here asserts a preference either way; it asserts what the editor
// actually does, so a deliberate change to that shows up as a failure here.

describe("Rails sample fixtures", () => {
  beforeEach(async () => {
    await atom.packages.activatePackage("language-ruby");
    await atom.packages.activatePackage("language-html");
    await atom.packages.activatePackage("language-ruby-on-rails");
  });

  function fixture(name) {
    return path.join(__dirname, "fixtures", name);
  }

  // Selection is asserted through selectGrammar rather than by opening the
  // file: an editor opened once is reused for the same path, so it would keep
  // whichever grammar the first case left it with.
  function selectedFor(name) {
    const file = fixture(name);
    return atom.grammars.selectGrammar(file, fs.readFileSync(file, "utf8"));
  }

  it("loads every grammar the package ships", () => {
    for (const scopeName of [
      "source.ruby.rails",
      "text.html.ruby",
      "source.ruby.rails.rjs",
      "source.sql.ruby",
    ]) {
      expect(atom.grammars.grammarForScopeName(scopeName)).toBeTruthy();
    }
  });

  it("scopes the Rails DSL calls the plain Ruby grammar knows nothing about", () => {
    const grammar = atom.grammars.grammarForScopeName("source.ruby.rails");
    const { tokens } = grammar.tokenizeLine("  has_many :orders, dependent: :destroy");
    const call = tokens.find((token) => token.value === "has_many");

    expect(call).toBeTruthy();
    expect(call.scopes.join(" ")).toMatch(/rails/);
  });

  it("wins the file types language-ruby does not also claim", () => {
    expect(atom.grammars.selectGrammar("report.rxml", "").scopeName).toBe("source.ruby.rails");
  });

  describe("the sample files", () => {
    beforeEach(() => atom.config.set("language.useTreeSitterParsers", true));

    it("open as plain Ruby and plain ERB, not as Rails", () => {
      expect(selectedFor("sample.rb").scopeName).toBe("source.ruby");
      expect(selectedFor("sample.html.erb").scopeName).toBe("text.html.erb");
    });

    it("parse without error", async () => {
      for (const name of ["sample.rb", "sample.html.erb"]) {
        const editor = await atom.workspace.open(fixture(name));
        const languageMode = editor.getBuffer().getLanguageMode();
        await languageMode.ready;

        expect(languageMode.tree.rootNode.hasError).toBe(false);
      }
    });
  });
});
