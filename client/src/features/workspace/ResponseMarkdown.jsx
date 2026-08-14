

const parseInline = (text, keyPrefix) => {
  const nodes = [];
  const pattern = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-b-${i++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code className="response-inline-code" key={`${keyPrefix}-c-${i++}`}>
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-i-${i++}`}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

const ResponseMarkdown = ({ text }) => {
  if (!text) return null;

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre className="response-code-block" key={`k${key++}`}>
          {lang && <div className="response-code-lang mono">{lang}</div>}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = parseInline(headingMatch[2], `h${key}`);
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      blocks.push(
        <Tag className="response-heading" key={`k${key++}`}>
          {content}
        </Tag>
      );
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote className="response-quote" key={`k${key++}`}>
          {parseInline(quoteLines.join(" "), `q${key}`)}
        </blockquote>
      );
      continue;
    }

    if (/^(\s*[-*]\s+|\s*\d+\.\s+)/.test(line)) {
      const isOrdered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (
        i < lines.length &&
        /^(\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i]) &&
        lines[i].trim() !== ""
      ) {
        const itemText = lines[i].replace(/^(\s*[-*]\s+|\s*\d+\.\s+)/, "");
        items.push(
          <li key={`li${key++}`}>{parseInline(itemText, `li${key}`)}</li>
        );
        i++;
      }
      const ListTag = isOrdered ? "ol" : "ul";
      blocks.push(
        <ListTag className="response-list" key={`k${key++}`}>
          {items}
        </ListTag>
      );
      continue;
    }

    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i].trim()) &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p className="response-paragraph" key={`k${key++}`}>
        {parseInline(paraLines.join(" "), `p${key}`)}
      </p>
    );
  }

  return <div className="response-markdown">{blocks}</div>;
};

export default ResponseMarkdown;
