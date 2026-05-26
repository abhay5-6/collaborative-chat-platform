"use client";

import Link from "next/link";

import {
  useRouter,
  usePathname,
} from "next/navigation";

import {
  BrainCircuit,
  LayoutGrid,
  LogOut,
} from "lucide-react";

import {
  useAuth
} from "@/components/AuthProvider";

import NotificationBell
from "@/components/NotificationBell";


export default function Navbar() {

  const router =
    useRouter();

  const pathname =
    usePathname();

  const auth =
    useAuth();


  function handleLogout() {

    auth.logout();

    router.push("/login");

    router.refresh();
  }


  function isActive(
    path: string
  ) {

    return pathname.startsWith(
      path
    );
  }


  return (

    <nav className="
      sticky
      top-0
      z-50
      w-full
      border-b
      border-neutral-800
      bg-black/80
      backdrop-blur-xl
    ">

      <div className="
        max-w-7xl
        mx-auto
        px-6
        py-4
        flex
        items-center
        justify-between
      ">

        {/* LEFT */}

        <div className="
          flex
          items-center
          gap-10
        ">

          <Link
            href="/"
            className="
              flex
              items-center
              gap-3
              group
            "
          >

            <div className="
              h-10
              w-10
              rounded-2xl
              bg-white
              text-black
              flex
              items-center
              justify-center
              font-bold
              shadow-lg
              group-hover:scale-105
              transition
            ">

              <BrainCircuit
                size={20}
              />

            </div>

            <div>

              <div className="
                text-xl
                font-semibold
                tracking-tight
                text-white
              ">

                Rework

              </div>

              <div className="
                text-[11px]
                uppercase
                tracking-[0.2em]
                text-neutral-500
              ">

                Cognitive Workspace

              </div>

            </div>

          </Link>


          {auth.isAuthenticated && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <Link
                href="/rooms"
                className={`
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  text-sm
                  transition

                  ${isActive("/rooms")
                    ? `
                      bg-white
                      text-black
                    `
                    : `
                      text-neutral-400
                      hover:text-white
                      hover:bg-neutral-900
                    `
                  }
                `}
              >

                <LayoutGrid
                  size={16}
                />

                Rooms

              </Link>

            </div>
          )}

        </div>


        {/* RIGHT */}

        <div className="
          flex
          items-center
          gap-4
        ">

          {auth.isAuthenticated ? (

            <>

              <div className="
                hidden
                md:flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                border
                border-neutral-800
                bg-neutral-950
                text-xs
                text-neutral-400
              ">

                AI Memory Active

              </div>


              <NotificationBell />


              <button
                onClick={
                  handleLogout
                }
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  bg-white
                  text-black
                  font-medium
                  hover:scale-105
                  transition
                "
              >

                <LogOut
                  size={16}
                />

                Logout

              </button>

            </>

          ) : (

            <div className="
              flex
              items-center
              gap-3
            ">

              <Link
                href="/login"
                className="
                  px-4
                  py-2
                  rounded-xl
                  text-neutral-400
                  hover:text-white
                  hover:bg-neutral-900
                  transition
                "
              >

                Login

              </Link>


              <Link
                href="/register"
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-white
                  text-black
                  font-semibold
                  hover:scale-105
                  transition
                  shadow-lg
                "
              >

                Register

              </Link>

            </div>
          )}

        </div>

      </div>

    </nav>
  );
}