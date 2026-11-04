((template
  (_ (code) @injection.content)) @injection.owner
  (#set! injection.language "ruby")
  (#set! injection.newlines-between)
  (#set! injection.content-edit-policy "content-words"))

((template
  (content) @injection.content) @injection.owner
  (#set! injection.language "sql")
  (#set! injection.content-edit-policy "content-words"))
