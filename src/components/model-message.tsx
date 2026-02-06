import type { UIMessage } from "ai";
import { Message, MessageContent } from "./ai-elements/message";
import { Response } from "./ai-elements/response";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "./ai-elements/reasoning";

export const UIMessageComponent = ({ message }: { message: UIMessage }) => {
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
              <Response key={i}>{part.text}</Response>
            );
          }
          if (part.type === "reasoning") {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
              <Reasoning key={i}>
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }
          if ("toolCallId" in part) {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
              <ToolCallDisplay key={i} part={part} />
            );
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );
};

const ToolCallDisplay = ({
  part,
}: {
  part: {
    toolCallId: string;
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
}) => {
  const input = part.input as { code?: string; language?: string } | undefined;
  return (
    <div className="my-2 rounded border border-zinc-700 bg-zinc-900 text-sm overflow-hidden">
      <div className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs font-mono flex items-center gap-2">
        <span>executeCode</span>
        {part.state === "input-streaming" && (
          <span className="text-yellow-400">streaming...</span>
        )}
        {part.state === "input-available" && (
          <span className="text-blue-400">executing...</span>
        )}
        {part.state === "output-available" && (
          <span className="text-green-400">done</span>
        )}
        {part.state === "output-error" && (
          <span className="text-red-400">error</span>
        )}
      </div>
      {input?.code && (
        <pre className="p-3 overflow-x-auto text-zinc-200">
          <code>{input.code}</code>
        </pre>
      )}
      {part.state === "output-available" && part.output != null && (
        <div className="border-t border-zinc-700 px-3 py-2 bg-zinc-950">
          <div className="text-xs text-zinc-500 mb-1">Result:</div>
          <pre className="text-zinc-300 overflow-x-auto">
            {typeof part.output === "string"
              ? part.output
              : JSON.stringify(part.output, null, 2)}
          </pre>
        </div>
      )}
      {part.state === "output-error" && part.errorText && (
        <div className="border-t border-zinc-700 px-3 py-2 bg-red-950/30">
          <div className="text-xs text-red-400 mb-1">Error:</div>
          <pre className="text-red-300 overflow-x-auto">{part.errorText}</pre>
        </div>
      )}
    </div>
  );
};
