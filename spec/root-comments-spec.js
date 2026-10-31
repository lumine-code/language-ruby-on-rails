describe("ERB host comments with generic source defaults", () => {
  let editor;
  beforeEach(async () => {
    jasmine.useRealClock();
    for (const name of ["language-javascript", "language-ruby", "language-sql"]) {
      if (lumine.packages.getLoadedPackage(name)) {
        await lumine.packages.deactivatePackage(name);
        await lumine.packages.unloadPackage(name);
      }
    }
    await lumine.packages.activatePackage("language-source");
    await lumine.packages.activatePackage("language-ruby-on-rails");
    editor = await lumine.workspace.open();
  });
  afterEach(() => editor?.destroy());

  for (const [scope, line] of [
    ["source.js.rails", "//"],
    ["source.sql.ruby", "--"],
  ]) {
    it("uses native root comment metadata in " + scope, async () => {
      editor.setGrammar(lumine.grammars.grammarForScopeName(scope));
      editor.setText("value");
      await editor.whenGrammarSettled();
      expect(await editor.getCommentDelimitersForBufferPosition([0, 0])).toEqual({
        line,
        block: ["/*", "*/"],
      });
      await editor.toggleLineCommentsForBufferRows(0, 0);
      await editor.whenGrammarSettled();
      expect(editor.getText()).toBe(line + " value");
      await editor.toggleLineCommentsForBufferRows(0, 0);
      await editor.whenGrammarSettled();
      expect(editor.getText()).toBe("value");
    });
    it("retains native Ruby comments inside " + scope, async () => {
      await lumine.packages.activatePackage("language-ruby");
      editor.setGrammar(lumine.grammars.grammarForScopeName(scope));
      editor.setText("<% value %>");
      await editor.whenGrammarSettled();
      const delimiters = await editor.getCommentDelimitersForBufferPosition([0, 4]);
      expect(delimiters.line).toBe("#");
      expect(delimiters.block).toBeUndefined();
    });
  }
});
