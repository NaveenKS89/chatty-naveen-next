import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;

    const db = client.db("ChattyNaveen");

    const chats = await db
      .collection("chats")
      .find(
        {
          userId: user.sub,
        },
        {
          projection: {
            messages: 0,
            userId: 0,
          },
        }
      )
      .sort({
        id: -1,
      })
      .toArray();

    res.status(200).json({
      chats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chat list",
    });
    console.log(error);
  }
}
