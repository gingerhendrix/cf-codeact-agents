import type { UIMessage } from "ai";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  CircleIcon,
  PlayIcon,
  XCircleIcon,
} from "lucide-react";
import { Message, MessageContent } from "./ai-elements/message";
import { Response } from "./ai-elements/response";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "./ai-elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "./ai-elements/chain-of-thought";
import {
  CodeBlock,
  CodeBlockCopyButton,
} from "./ai-elements/code-block";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export const UIMessageComponent = ({ message }: { message: UIMessage }) => {
  const reasoningParts = message.parts.filter((p) => p.type === "reasoning");
  let reasoningRendered = false;

  return (
    <Message from={message.role}>
      <MessageContent variant="flat">
        {message.parts.map((part, i) => {
          if (part.type === "step-start") {
            return i > 0 ? <hr key={i} className="my-4 border-border" /> : null;
          }
          if (part.type === "text") {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
              <Response key={i}>{part.text}</Response>
            );
          }
          if (part.type === "reasoning") {
            if (reasoningRendered) return null;
            reasoningRendered = true;

            if (reasoningParts.length === 1) {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
                <Reasoning key={i}>
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );
            }

            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
              <ChainOfThought key={i}>
                <ChainOfThoughtHeader>
                  Thinking ({reasoningParts.length} steps)
                </ChainOfThoughtHeader>
                <ChainOfThoughtContent>
                  {reasoningParts.map((rp, ri) => (
                    <ChainOfThoughtStep
                      // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
                      key={ri}
                      label={`Step ${ri + 1}`}
                      status={
                        rp.type === "reasoning" &&
                        "state" in rp &&
                        rp.state === "streaming"
                          ? "active"
                          : "complete"
                      }
                    >
                      <Response className="text-muted-foreground text-xs">
                        {rp.type === "reasoning" ? rp.text : ""}
                      </Response>
                    </ChainOfThoughtStep>
                  ))}
                </ChainOfThoughtContent>
              </ChainOfThought>
            );
          }
          if ("toolCallId" in part) {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
              <ExecuteCodeView key={i} part={part} />
            );
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );
};

const getStatusBadge = (state: string) => {
  const config = {
    "input-streaming": {
      icon: CircleIcon,
      label: "Generating...",
      className: "",
    },
    "input-available": {
      icon: PlayIcon,
      label: "Executing...",
      className: "animate-pulse",
    },
    "output-available": {
      icon: CheckCircleIcon,
      label: "Complete",
      className: "text-green-600",
    },
    "output-error": {
      icon: XCircleIcon,
      label: "Error",
      className: "text-red-600",
    },
  } as const;
  const c = config[state as keyof typeof config];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      <Icon className={cn("size-3.5", c.className)} />
      {c.label}
    </Badge>
  );
};

function ExecuteCodeView({
  part,
}: {
  part: {
    toolCallId: string;
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
}) {
  const input = part.input as
    | { code?: string; language?: string }
    | undefined;

  return (
    <Collapsible
      defaultOpen={false}
      className="group my-2 rounded-lg border bg-card overflow-hidden"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
        <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span>Execute Code</span>
        {getStatusBadge(part.state)}
      </CollapsibleTrigger>

      <CollapsibleContent>
        {/* Code input with syntax highlighting */}
        {input?.code && (
          <CodeBlock
            code={input.code}
            language={input.language ?? "javascript"}
          >
            <CodeBlockCopyButton />
          </CodeBlock>
        )}

        {/* Streaming state */}
        {part.state === "input-streaming" && !input?.code && (
          <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse">
            Generating code...
          </div>
        )}

        {/* Executing state */}
        {part.state === "input-available" && (
          <div className="px-3 py-2 text-sm text-muted-foreground animate-pulse">
            Executing...
          </div>
        )}

        {/* Output */}
        {part.state === "output-available" && part.output != null && (
          <div className="border-t px-3 py-2">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
              Result
            </div>
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
              {typeof part.output === "string"
                ? part.output
                : JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {part.state === "output-error" && part.errorText && (
          <div className="border-t px-3 py-2 bg-destructive/10">
            <div className="text-xs text-destructive mb-1 uppercase tracking-wide font-medium">
              Error
            </div>
            <pre className="text-sm text-destructive overflow-x-auto whitespace-pre-wrap">
              {part.errorText}
            </pre>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
