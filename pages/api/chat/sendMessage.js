import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { chatId: chatIdFromParam, message } = await req.json();

    if (!message || typeof message !== "string" || message.length > 200) {
      return new Response(
        {
          message: "Invalid or too long message",
        },
        {
          status: 400,
        }
      );
    }

    let chatId = chatIdFromParam;
    const initialChatMessage = {
      role: "system",
      content:
        "Your name is Chatty Naveen. You are a highly energetic, fast and positive assistant. Your respopnse should be in the markdown format",
    };

    let newChatId;
    let newChatMessages = [];
    if (chatId) {
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: `${req.headers.get("cookie")}`,
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );

      let json = await response.json();

      newChatMessages = json.chat.messages || [];

      console.log(newChatMessages, "newChatMessages", chatId);
    } else {
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            message: message,
          }),
        }
      );

      const json = await response.json();
      chatId = json._id;
      newChatId = json._id;

      newChatMessages = json.messages || [];
      console.log(newChatMessages, "newChatMessages");
    }

    let messagesToInclude = [];
    newChatMessages.reverse();

    let usedTokens = 0;

    for (let chatMessage of newChatMessages) {
      const messageTokens = chatMessage.content.length / 4;

      usedTokens += messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(chatMessage);
      } else {
        break;
      }
    }

    messagesToInclude.reverse();

    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [initialChatMessage, ...messagesToInclude],
          stream: true,
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
          if (newChatId) {
            emit(chatId, "newChatId");
          }
        },
        onAfterStream: async ({ fullContent }) => {
          await fetch(
            `${req.headers.get("origin")}/api/chat/addMessageToChat`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                cookie: `${req.headers.get("cookie")}`,
              },
              body: JSON.stringify({
                chatId,
                role: "assistant",
                content: fullContent,
              }),
            }
          );
        },
      }
    );

    return new Response(stream);
  } catch (error) {
    return new Response(
      {
        message: "Failed to Send Message",
      },
      {
        status: 500,
      }
    );
  }
}
