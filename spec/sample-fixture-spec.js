const fs = require("fs");
const path = require("path");

// The fixtures beside this file are plain samples — the files to open when you
// want to look at the highlighting rather than assert on it.
//
// They also record how this package's grammars are reached, which is worth
// knowing because it is not obvious.
//
// `.rb` and `.html.erb` are shared with plain Ruby and plain ERB and used to
// score identically, so the winner was whichever package activated first. A
// content regex settles that: a Rails base class or DSL call earns 0.05, and
// its absence costs 0.05, so a Rails file wins and a plain one no longer does.
//
// It does not win against Tree-sitter, and cannot: preferring Tree-sitter is
// worth 0.1, and these grammars are TextMate. Under the default settings a
// Rails file therefore still opens as plain Ruby or plain ERB, which is
// defensible — the Tree-sitter grammar is the better base, and what this
// package adds over it is a set of DSL scopes.
//
// `.rjs` and `.rxml` are Rails-only formats and win outright.

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

  it("wins .rjs, which is a Rails-only format", () => {
    // language-ruby used to claim `rjs` too, which made this a tie decided by
    // activation order.
    expect(atom.grammars.selectGrammar("update.rjs", "page[:x]").scopeName).toBe(
      "source.ruby.rails.rjs",
    );
  });

  describe("with TextMate grammars preferred", () => {
    const railsModel = "class User < ApplicationRecord\n  has_many :orders\nend\n";
    const plainRuby = "class Plain\n  def run\n    1\n  end\nend\n";
    const railsView = "<%= link_to 'x', root_path %>\n";
    const plainErb = "<p>hello</p>\n";

    beforeEach(() => atom.config.set("language.useTreeSitterParsers", false));

    it("claims a file that looks like Rails", () => {
      expect(atom.grammars.selectGrammar("user.rb", railsModel).scopeName).toBe(
        "source.ruby.rails",
      );
      expect(atom.grammars.selectGrammar("show.html.erb", railsView).scopeName).toBe(
        "text.html.ruby",
      );
    });

    it("leaves a file that does not", () => {
      // The content regex costs 0.05 when it fails, so plain Ruby and plain ERB
      // now lose this grammar rather than winning it on activation order.
      expect(atom.grammars.selectGrammar("plain.rb", plainRuby).scopeName).toBe("source.ruby");
      expect(atom.grammars.selectGrammar("page.html.erb", plainErb).scopeName).toBe(
        "text.html.erb",
      );
    });
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
