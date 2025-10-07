import {
  Conversation as AIConversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader, Trash } from "lucide-react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputButton,
  PromptInputSubmit,
  type PromptInputMessage,
} from "./ai-elements/prompt-input";
import type { ModelMessage as ModelMessageType } from "ai";
import type { Status } from "@/hooks/useExecutionAgent";
import { ModelMessage } from "./model-message";

export const Conversation = ({
  messages,
  input,
  onInputChange,
  onSubmit,
  status,
  onModelChange,
  selectedModel,
  clearMessages,
  models,
}: {
  messages: ModelMessageType[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  status: Status | null;
  onModelChange: (model: string) => void;
  clearMessages: () => void;
  models: { name: string; value: string }[];
  selectedModel?: string;
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
  };
  return (
    <div className="flex flex-col h-full">
      <AIConversation className="h-full">
        <ConversationContent>
          {messages.map((message, i) => (
            <ModelMessage key={i} message={message} />
          ))}
          {status == "submitted" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </AIConversation>

      <PromptInput onSubmit={onSubmit} className="mt-4" globalDrop multiple>
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea onChange={handleInputChange} value={input} />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputModelSelect
              onValueChange={onModelChange}
              value={selectedModel}
            >
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map((model) => (
                  <PromptInputModelSelectItem
                    key={model.value}
                    value={model.value}
                  >
                    {model.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>

            <PromptInputButton onClick={() => clearMessages()}>
              <Trash />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit
            disabled={!input && !status}
            status={status ?? "ready"}
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
};
