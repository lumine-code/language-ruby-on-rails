const path = require("path");

const fixture = (name) => path.join(__dirname, "fixtures", name);
const packagePath = (name) => path.resolve(__dirname, "..", "..", name);

describe("Ruby on Rails Tree-sitter wrappers", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage(packagePath("language-javascript"));
    await lumine.packages.activatePackage(packagePath("language-ruby"));
    await lumine.packages.activatePackage(packagePath("language-sql"));
    await lumine.packages.activatePackage("language-ruby-on-rails");
  });

  it("exposes only root-only JavaScript and SQL ERB grammars", () => {
    const javascript = lumine.grammars.grammarForScopeName("source.js.rails");
    const sql = lumine.grammars.grammarForScopeName("source.sql.ruby");

    expect(javascript.constructor.name).toBe("TreeSitterGrammar");
    expect(sql.constructor.name).toBe("TreeSitterGrammar");
    expect(javascript.fileTypes).toEqual(["js.erb"]);
    expect(sql.fileTypes).toEqual(["erbsql", "sql.erb"]);
    expect(javascript.injectionNames).toEqual([]);
    expect(sql.injectionNames).toEqual([]);
  });

  it("resolves wrapper and delegated file types deterministically", () => {
    expect(lumine.grammars.selectGrammar("application.js.erb", "").scopeName).toBe(
      "source.js.rails",
    );
    expect(lumine.grammars.selectGrammar("report.sql.erb", "").scopeName).toBe("source.sql.ruby");
    expect(lumine.grammars.selectGrammar("report.erbsql", "").scopeName).toBe("source.sql.ruby");
    expect(lumine.grammars.selectGrammar("model.rjs", "").scopeName).toBe("source.ruby");
    expect(lumine.grammars.selectGrammar("model.rb", "").scopeName).toBe("source.ruby");
  });

  it("injects Ruby directives and JavaScript content", async () => {
    const editor = await lumine.workspace.open(fixture("sample.js.erb"));
    await editor.languageMode.ready;

    const text = editor.getText();
    const scopesAt = (needle, offset = 0) => {
      const index = text.indexOf(needle) + offset;
      const point = editor.getBuffer().positionForCharacterIndex(index);
      return editor.scopeDescriptorForBufferPosition(point).getScopesArray();
    };

    expect(editor.getGrammar().scopeName).toBe("source.js.rails");
    expect(editor.languageMode.tree.rootNode.hasError).toBe(false);
    expect(scopesAt("const")).toContain("source.js");
    expect(scopesAt("current_user")).toContain("source.ruby");
    expect(scopesAt("enabled")).toContain("source.ruby");
    expect(scopesAt("<%", 1)).toContain("punctuation.section.embedded.begin.erb");
    expect(scopesAt("<%=", 1)).toContain("punctuation.section.embedded.begin.erb");
    expect(scopesAt("Generated")).toContain("comment.block.erb");
    for (const scopeName of ["source.ruby", "source.js"]) {
      const layers = editor.languageMode
        .getAllInjectionLayers()
        .filter((layer) => layer.grammar.scopeName === scopeName);
      expect(layers.length).toBe(1);
      expect(layers[0].tree.rootNode.hasError).toBe(false);
    }
  });

  it("injects Ruby directives and SQL content", async () => {
    const editor = await lumine.workspace.open(fixture("sample.sql.erb"));
    await editor.languageMode.ready;

    const text = editor.getText();
    const scopesAt = (needle) => {
      const index = text.indexOf(needle);
      const point = editor.getBuffer().positionForCharacterIndex(index);
      return editor.scopeDescriptorForBufferPosition(point).getScopesArray();
    };

    expect(editor.getGrammar().scopeName).toBe("source.sql.ruby");
    expect(editor.languageMode.tree.rootNode.hasError).toBe(false);
    expect(scopesAt("SELECT")).toContain("source.sql");
    expect(scopesAt("active_only")).toContain("source.ruby");
    expect(scopesAt("Report")).toContain("comment.block.erb");
    for (const scopeName of ["source.ruby", "source.sql"]) {
      const layers = editor.languageMode
        .getAllInjectionLayers()
        .filter((layer) => layer.grammar.scopeName === scopeName);
      expect(layers.length).toBe(1);
      expect(layers[0].tree.rootNode.hasError).toBe(false);
    }
  });
});
