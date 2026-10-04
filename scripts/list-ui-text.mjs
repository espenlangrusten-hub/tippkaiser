// Lists user-facing text in .ts/.tsx files: JSX text, string and template literals that
// read like words. Used to find untranslated copy; prints file:line and the text.
import ts from "typescript";
import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
const wordy = (s) => /[A-Za-zÀ-ÿ]{3,}/.test(s) && /\s/.test(s.trim()) || /[æøåÆØÅ]/.test(s);
const skipAttr = new Set(["className", "href", "src", "key", "id", "htmlFor", "type", "role", "rel", "target", "sizes", "autoComplete", "inputMode", "d", "viewBox", "fill", "stroke", "style"]);

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = [];
  const visit = (node) => {
    let text = null;
    if (ts.isJsxText(node)) text = node.getText().replace(/\s+/g, " ").trim();
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const p = node.parent;
      if (p && ts.isJsxAttribute(p) && skipAttr.has(p.name.getText())) text = null;
      else if (p && (ts.isImportDeclaration(p) || ts.isExportDeclaration(p))) text = null;
      else text = node.text;
    } else if (ts.isTemplateExpression(node)) text = node.getText();
    const uiAttr = node.parent && ts.isJsxAttribute(node.parent) && ["aria-label", "placeholder", "title", "alt", "label", "value"].includes(node.parent.name.getText());
    if (text && (wordy(text) || ((ts.isJsxText(node) || uiAttr) && /[A-Za-zÀ-ÿ]{2,}/.test(text)))) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
      out.push(`${file}:${line + 1}: ${text.slice(0, 220)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (out.length) console.log(out.join("\n"));
}
