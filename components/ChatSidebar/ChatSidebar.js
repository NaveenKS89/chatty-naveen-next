import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faMessage, faSignOut } from "@fortawesome/free-solid-svg-icons";

export const ChatSidebar = ({ chatId }) => {
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    const getChats = async () => {
      const response = await fetch("/api/chat/getChatList", {
        method: "GET",
      });

      const { chats } = await response.json();

      setChatList(chats || []);
    };

    getChats();
  }, [chatId]);

  return (
    <aside className="flex flex-col overflow-hidden bg-gray-900 text-white">
      <Link
        href="/chat"
        className="sidebar-menu-item bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
      >
        <FontAwesomeIcon icon={faAdd} />
        New chat
      </Link>

      <div className="flex-1 overflow-auto bg-gray-950">
        {chatList.map((chat) => {
          return (
            <Link
              key={chat._id}
              href={`/chat/${chat._id}`}
              className={`sidebar-menu-item ${
                chatId === chat._id ? "bg-gray-700 hover:bg-gray-700" : ""
              }`}
            >
              <FontAwesomeIcon icon={faMessage} className="text-white/50" />
              <span
                title={chat.title}
                className="overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {chat.title}
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/api/auth/logout"
        className="sidebar-menu-item hover:bg-red-800"
      >
        <FontAwesomeIcon icon={faSignOut} />
        Logout
      </Link>
    </aside>
  );
};
