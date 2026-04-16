import { ChatSidebar } from "components/ChatSidebar";
import { useMemo } from "react";
import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { Message } from "components/Message";
import { useRouter } from "next/router";
import clientPromise from "lib/mongodb";
import { getSession } from "@auth0/nextjs-auth0";
import { ObjectId } from "mongodb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function Home({ chatId, title, messages = [] }) {
  const [message, setMessage] = useState("");
  const [streamMessage, setStreamMessage] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const [fullMessage, setFullMessage] = useState("");
  const [originalChatId, setOriginalChatId] = useState(chatId);
  const router = useRouter();

  const routeHasChanged = chatId !== originalChatId;

  useEffect(() => {
    setNewChatId(null);
    setNewChatMessages([]);
  }, [chatId]);

  useEffect(() => {
    if (!isGenerating && fullMessage && !routeHasChanged) {
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          content: fullMessage,
          role: "assistant",
        },
      ]);

      setFullMessage("");
    }
  }, [isGenerating, fullMessage, routeHasChanged]);

  useEffect(() => {
    if (!isGenerating && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, isGenerating, router]);

  const handleOnChange = (e) => {
    setMessage(e.target.value);
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setOriginalChatId(chatId);
    setNewChatMessages((prev) => {
      const newChatmessages = [
        ...prev,
        {
          _id: uuid(),
          role: "user",
          content: message,
        },
      ];

      return newChatmessages;
    });

    try {
      const response = await fetch("/api/chat/sendMessage", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message, chatId: chatId }),
      });

      const data = response.body;

      if (!data) {
        return;
      }

      const reader = data.getReader();
      let content = "";
      await streamReader(reader, (message) => {
        if (message.event === "newChatId") {
          setNewChatId(message.content);
        } else {
          setStreamMessage((s) => `${s}${message.content}`);
          content = content + message.content;
        }
      });

      setFullMessage(content);
      setStreamMessage("");
      setMessage("");
    } catch (error) {
      console.log(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const allMessages = useMemo(
    () => [...messages, ...newChatMessages],
    [messages, newChatMessages]
  );

  return (
    <div>
      <Head>
        <title>New Chat</title>
      </Head>
      <main className="grid h-screen grid-cols-[260px_1fr] ">
        <ChatSidebar chatId={chatId} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex flex-1 flex-col-reverse overflow-auto text-white">
            {!allMessages?.length && !streamMessage && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <FontAwesomeIcon
                  icon={faRobot}
                  className="text-6xl text-green-200"
                />
                <p className="text-4xl font-bold text-white/50">
                  Ask me any question
                </p>
              </div>
            )}
            {!!allMessages?.length && (
              <div className="mb-auto">
                {allMessages.map((message) => {
                  return (
                    <Message
                      key={message._id}
                      role={message.role}
                      content={message.content}
                    />
                  );
                })}
                {!!streamMessage && !routeHasChanged && (
                  <Message role="assistant" content={streamMessage} />
                )}
              </div>
            )}
            {!!streamMessage && !!routeHasChanged && (
              <Message
                content="Only one message at a time. Please allow other message to complete before requesting a new question"
                role="notice"
              />
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleOnSubmit}>
              <fieldset className="flex gap-2" disabled={isGenerating}>
                <textarea
                  value={message}
                  onChange={handleOnChange}
                  placeholder={isGenerating ? "" : "Send a message..."}
                  className={`w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-2 focus:outline-emerald-500 ${
                    isGenerating ? "bg-gray-400" : ""
                  }`}
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] ?? null;

  if (chatId) {
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    const client = await clientPromise;
    const { user } = await getSession(ctx.req, ctx.res);

    const db = client.db("ChattyNaveen");

    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: objectId,
    });

    if (!chat) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    return {
      props: {
        chatId,
        title: chat.title,
        messages: chat.messages.map((msg) => ({
          ...msg,
          _id: uuid(),
        })),
      },
    };
  } else {
    return {
      props: {},
    };
  }
};
