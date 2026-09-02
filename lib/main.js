const RUBY = "ruby";

const WRAPPERS = [
  { scope: "source.js.rails", contentLanguage: "javascript" },
  { scope: "source.sql.ruby", contentLanguage: "sql" },
];

function registerWrapper({ scope, contentLanguage }) {
  lumine.grammars.addInjectionPoint(scope, {
    type: "template",
    language: () => RUBY,
    content: (node) => node.descendantsOfType("code"),
    newlinesBetween: true,
  });

  lumine.grammars.addInjectionPoint(scope, {
    type: "template",
    language: () => contentLanguage,
    content: (node) => node.descendantsOfType("content"),
  });
}

exports.activate = function () {
  for (const wrapper of WRAPPERS) registerWrapper(wrapper);
};
