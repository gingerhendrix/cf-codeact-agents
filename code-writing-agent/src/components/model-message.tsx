import { type ModelMessage as ModelMessageType } from "ai";
import { Message, MessageContent } from "./ai-elements/message";
import { Response } from "./ai-elements/response";

export const ModelMessage = ({ message }: { message: ModelMessageType }) => {
  let text = "";
  if (typeof message.content === "string") {
    text = message.content;
  }
  if (Array.isArray(message.content)) {
    text = message.content.map(part => {
      if (part.type === "text") {
        return part.text;
      }
      return '';
    }).join('');
  }
  // We won't have tools
  let role = message.role === "tool" ? "assistant" : message.role;

  return (
    <Message from={role}>
      <MessageContent>
        <Response>
          {text}
        </Response>
      </MessageContent>
    </Message>
  )
}
