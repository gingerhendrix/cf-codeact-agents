import type { UIMessage } from "ai";
import { Loader, Trash } from "lucide-react";
import {
  Conversation as AIConversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { Status } from "@/hooks/useExecutionAgent";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "./ai-elements/prompt-input";
import { UIMessageComponent } from "./ui-message";

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
  messages: UIMessage[];
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
          {messages.map((message) => (
            <UIMessageComponent key={message.id} message={message} />
          ))}
          {status === "submitted" && <Loader />}
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
