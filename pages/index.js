import { useUser } from "@auth0/nextjs-auth0/client";
import Head from "next/head";
import Link from "next/link";
import { getSession } from "@auth0/nextjs-auth0";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const { user, error, isLoading } = useUser();

  console.log(user);

  return (
    <div>
      <Head>
        <title>Chatty Naveen - Login or Signup</title>
      </Head>
      <>
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error.message}</div>
        ) : (
          <>
            <div className="flex min-h-screen w-full items-center justify-center bg-gray-800 text-center text-white">
              {!user ? (
                <div flex items-center justify-center>
                  <FontAwesomeIcon
                    icon={faRobot}
                    className="text-6xl text-green-200"
                  />
                  <div className="mt-2">
                    <p className="text-4xl font-bold text-white">
                      Welcome to Chatty Naveen
                    </p>
                    <p className="text-sm text-white">
                      Please login to get started with the chat
                    </p>
                  </div>
                  <div className="mt-4 flex flex-row items-center justify-center gap-3">
                    <Link
                      className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                      href="/api/auth/login"
                    >
                      Login
                    </Link>
                    <Link
                      className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                      href="/api/auth/signup"
                    >
                      Signup
                    </Link>
                  </div>
                </div>
              ) : null}
              {!!user ? <Link href="/api/auth/logout">Logout</Link> : null}
            </div>
          </>
        )}
      </>
    </div>
  );
}

export const getServerSideProps = async (ctx) => {
  const session = await getSession(ctx.req, ctx.res);
  if (!!session) {
    return {
      redirect: {
        destination: "/chat",
      },
    };
  }

  return {
    props: {},
  };
};
