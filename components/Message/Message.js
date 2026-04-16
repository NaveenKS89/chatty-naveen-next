import React from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";

export const Message = ({ role, content }) => {
  const { user } = useUser();
  return (
    <div
      className={`grid grid-cols-[30px_1fr] gap-5 p-5 ${
        role === "notice"
          ? "bg-red-600"
          : role === "assistant"
          ? "bg-gray-600"
          : ""
      }`}
    >
      {role !== "notice" && (
        <div>
          {role === "user" && !!user && (
            <Image
              src={user.picture}
              height={30}
              width={30}
              alt={user.name}
              className="rounded-sm shadow-md shadow-black/50"
            />
          )}
          {role === "assistant" && (
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-sm bg-gray-800 shadow-md shadow-black/50">
              <FontAwesomeIcon icon={faRobot} className="text-green-300" />
            </div>
          )}
        </div>
      )}
      <div className="prose prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};
