import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId, ReturnDocument } from "mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;

    const db = client.db("ChattyNaveen");

    const { chatId, role, content } = req.body;

    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid ChatId",
      });
    }

    if (
      !content ||
      typeof content !== "string" ||
      (user.role === "user" && content.length > 200) ||
      (user.role === "assistant" && content.length > 10000)
    ) {
      return res.status(400).json({
        message: "Invalid or too long message",
      });
    }

    if (role !== "user" && role !== "assistant") {
      return res.status(400).json({
        message: "Role must be either user or assistant",
      });
    }

    const chat = await db.collection("chats").findOneAndUpdate(
      {
        _id: new ObjectId(chatId),
        userId: user.sub,
      },
      {
        $push: {
          messages: {
            role,
            content,
          },
        },
      },
      {
        returnDocument: "after",
      }
    );

    res.status(200).json({
      chat: {
        ...chat.value,
        _id: chat.value._id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "An error message occured when adding chat",
    });
  }
}
