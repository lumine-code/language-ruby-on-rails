; Based on tree-sitter/tree-sitter-embedded-template queries/highlights.scm at
; v0.25.0 (MIT), expanded for all delimiters accepted by the parser.

([(comment_directive) (directive) (output_directive)] @meta.embedded.block.erb
  (#set! adjust.startBeforeFirstMatchOf "\\S")
  (#is-not? test.endsOnSameRowAs firstChild.endPosition))

([(comment_directive) (directive) (output_directive)] @meta.embedded.line.erb
  (#set! adjust.startBeforeFirstMatchOf "\\S")
  (#is? test.endsOnSameRowAs firstChild.endPosition))

(comment_directive) @comment.block.erb
(comment) @comment.block.erb

[
  "<%"
  "<%_"
  "<%|"
  "<%~"
  "<%="
  "<%=="
  "<%|="
  "<%|=="
  "<%-"
  "<%#"
  "<%graphql"
] @punctuation.section.embedded.begin.erb

[
  "%>"
  "-%>"
  "_%>"
  "=%>"
] @punctuation.section.embedded.end.erb
