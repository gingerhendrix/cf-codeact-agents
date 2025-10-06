/** biome-ignore-all lint/correctness/useUniqueElementIds: it's alright */
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
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
} from "@/components/ai-elements/prompt-input";
import { use, useCallback, useEffect, useRef, useState } from "react";

import { ModelMessage } from "./components/model-message";
import { useExecutionAgent } from "./hooks/useExecutionAgent";
import { Trash } from "lucide-react";
import { models } from "tokenlens";

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    // Check localStorage first, default to dark if not found
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Apply theme class on mount and when theme changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    // Save theme preference to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const [agentInput, setAgentInput] = useState("");
  const handleAgentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setAgentInput(e.target.value);
  };

  const handleAgentSubmit = async (_input: PromptInputMessage) => {
    if (!agentInput.trim()) return;

    const message = agentInput;
    setAgentInput("");

    // Send message to agent
    sendMessage(message);
  };

  const models = [
    {
      name: "GPT-5",
      value: "openai:gpt-5",
    },
  ];

  const agents = [
    {
      name: "Code Execution Agent",
      value: "execution-chat",
    },
    {
      name: "Simple Execution Agent",
      value: "simple-chat",
    },
  ];

  const setModel = (model: string) => {
    console.log("Model set to:", model);
  };
  const setAgent = (agent: string) => {
    console.log("Agent set to:", agent);
  };

  const {
    messages: agentMessages,
    status,
    sendMessage,
    clearMessages,
  } = useExecutionAgent();

  // Scroll to bottom when messages change
  useEffect(() => {
    agentMessages.length > 0 && scrollToBottom();
  }, [agentMessages, scrollToBottom]);

  return (
    <div className="h-[100vh] w-full p-4 flex justify-center items-center bg-fixed overflow-hidden">
      <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
        <div className="flex flex-col h-full">
          <Conversation className="h-full">
            <ConversationContent>
              {agentMessages.map((message, i) => (
                <ModelMessage key={i} message={message} />
              ))}
              {status == "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={handleAgentSubmit}
            className="mt-4"
            globalDrop
            multiple
          >
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={handleAgentInputChange}
                value={agentInput}
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setAgent(value);
                  }}
                  value={"execution-chat"}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent className="text-white bg-background">
                    {agents.map((agent) => (
                      <PromptInputModelSelectItem
                        key={agent.value}
                        value={agent.value}
                      >
                        {agent.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>

                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value);
                  }}
                  value={"openai:gpt-5"}
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
                disabled={!agentInput && !status}
                status={status}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
