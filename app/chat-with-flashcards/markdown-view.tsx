"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className = "" }: MarkdownViewProps) {
  return (
    <div className={`markdown-content max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Override default styling for markdown elements
          p: (props) => <p className="mb-4 last:mb-0" {...props} />,
          h1: (props) => <h1 className="text-xl font-bold my-4" {...props} />,
          h2: (props) => <h2 className="text-lg font-bold my-3" {...props} />,
          h3: (props) => <h3 className="text-md font-bold my-2" {...props} />,
          ul: (props) => <ul className="list-disc ml-6 mb-4" {...props} />,
          ol: (props) => <ol className="list-decimal ml-6 mb-4" {...props} />,
          li: (props) => <li className="mb-1" {...props} />,
          a: (props) => <a className="text-blue-600 hover:underline" {...props} />,
          code: ({className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            // Using type assertion with a more specific type
            const codeProps = props as { inline?: boolean };
            const isInline = !match && codeProps.inline;
            return isInline ? 
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code> : 
              <code className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto my-2" {...props}>{children}</code>;
          },
          pre: (props) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto my-2" {...props} />,
          blockquote: (props) => <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />,
          table: (props) => <table className="border-collapse border border-gray-300 my-4" {...props} />,
          th: (props) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
          td: (props) => <td className="border border-gray-300 px-4 py-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
