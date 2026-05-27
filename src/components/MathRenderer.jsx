import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const KATEX_OPTIONS = {
  throwOnError: false,
  strict: false,
  trust: false,
};

function MathRenderer({ value = "", className = "" }) {
  if (!value || (typeof value === "string" && !value.trim())) {
    return null;
  }

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}>
        {String(value)}
      </ReactMarkdown>
    </div>
  );
}

export default MathRenderer;
