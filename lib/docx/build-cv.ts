import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

/**
 * Convert markdown (from Claude CV adapter) to a .docx Buffer.
 * Minimal parser — handles #, ##, ###, **bold**, *italic*, bullets (▸ or -),
 * and plain paragraphs. Good enough for ATS-friendly single-column layout.
 */

type Line =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string; italic?: boolean }
  | { kind: "blank" };

function parseMarkdown(md: string): Line[] {
  const out: Line[] = [];
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      out.push({ kind: "blank" });
      continue;
    }
    if (line.startsWith("### ")) out.push({ kind: "h3", text: line.slice(4) });
    else if (line.startsWith("## ")) out.push({ kind: "h2", text: line.slice(3) });
    else if (line.startsWith("# ")) out.push({ kind: "h1", text: line.slice(2) });
    else if (line.startsWith("▸ ") || line.startsWith("- ") || line.startsWith("* "))
      out.push({ kind: "bullet", text: line.slice(2) });
    else if (line.startsWith("*") && line.endsWith("*") && line.length > 2)
      out.push({ kind: "text", text: line.slice(1, -1), italic: true });
    else out.push({ kind: "text", text: line });
  }
  return out;
}

/** Parse inline **bold** and *italic* into TextRun[]. */
function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > lastIdx) {
      runs.push(new TextRun({ text: text.slice(lastIdx, match.index) }));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
    } else if (token.startsWith("*")) {
      runs.push(new TextRun({ text: token.slice(1, -1), italics: true }));
    } else if (token.startsWith("[")) {
      // Link — render as plain text for .docx simplicity.
      const m = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (m) {
        runs.push(
          new TextRun({
            text: m[1],
            style: "Hyperlink",
          }),
        );
      }
    }
    lastIdx = match.index + token.length;
  }
  if (lastIdx < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIdx) }));
  }
  return runs.length ? runs : [new TextRun({ text })];
}

export async function buildCvDocx(markdown: string): Promise<Buffer> {
  const lines = parseMarkdown(markdown);
  const paragraphs: Paragraph[] = [];

  for (const l of lines) {
    switch (l.kind) {
      case "h1":
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
            children: parseInline(l.text).map(
              (r) =>
                new TextRun({
                  text: r.toString().replace(/[<][^>]+[>]/g, ""),
                  bold: true,
                  size: 32,
                }),
            ),
          }),
        );
        break;
      case "h2":
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: l.text.toUpperCase(), bold: true, size: 22 }),
            ],
          }),
        );
        break;
      case "h3":
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 40 },
            children: parseInline(l.text),
          }),
        );
        break;
      case "bullet":
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: parseInline(l.text),
          }),
        );
        break;
      case "text":
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: parseInline(l.text).map((r) =>
              l.italic
                ? new TextRun({ text: r.toString().replace(/[<][^>]+[>]/g, ""), italics: true })
                : r,
            ),
          }),
        );
        break;
      case "blank":
        paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
        break;
    }
  }

  const doc = new Document({
    creator: "Job Scouting AL",
    title: "Adapted CV",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
