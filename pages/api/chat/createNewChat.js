import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.length > 200) {
      return res.status(400).json({
        message: "Invalid or too long message",
      });
    }

    const newUserMessage = {
      role: "user",
      content: message,
    };

    const client = await clientPromise;
    const db = client.db("ChattyNaveen");

    const chat = await db.collection("chats").insertOne({
      userId: user.sub,
      messages: [newUserMessage],
      title: message,
    });

    res.status(200).json({
      _id: chat.insertedId.toString(),
      messages: [newUserMessage],
      title: message,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occured when creating mongo DB connection",
    });
    console.log(error);
  }
}
