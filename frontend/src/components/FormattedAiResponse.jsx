import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FormattedAiResponse = ({ text }) => {
  const content = String(text || "").trim();

  if (!content) {
    return null;
  }

  return (
    <div className="overflow-x-auto text-sm leading-7 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ ...props }) => <h2 className="mt-5 mb-2 text-base font-bold text-slate-900" {...props} />,
          h3: ({ ...props }) => <h3 className="mt-4 mb-2 text-sm font-semibold text-slate-900" {...props} />,
          p: ({ ...props }) => <p className="mb-3 text-sm text-slate-700" {...props} />,
          ul: ({ ...props }) => <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />,
          ol: ({ ...props }) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />,
          li: ({ ...props }) => <li className="text-sm text-slate-700" {...props} />,
          strong: ({ ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
          table: ({ ...props }) => (
            <table className="mb-4 min-w-full border-collapse overflow-hidden rounded-lg border border-slate-300 bg-white" {...props} />
          ),
          thead: ({ ...props }) => <thead className="bg-slate-100" {...props} />,
          th: ({ ...props }) => <th className="border border-slate-300 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" {...props} />,
          td: ({ ...props }) => <td className="border border-slate-200 px-3 py-2 align-top text-sm text-slate-700" {...props} />,
          code: ({ inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedAiResponse;
