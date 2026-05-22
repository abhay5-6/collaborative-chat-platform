"use client";

import {
  useEffect,
  useState
} from "react";

import {
  Bell
} from "lucide-react";

import {
  toast
} from "sonner";

import {
  approveJoinRequest,
  getJoinRequests,
  rejectJoinRequest
} from "@/lib/api/notifications";

type JoinRequest = {
  request_id: number;
  room_id: number;
  room_name: string;
  user_id: number;
  username: string;
};

export default function NotificationBell() {

  const [open, setOpen] =
    useState(false);

  const [
    notifications,
    setNotifications
  ] = useState<JoinRequest[]>(
    []
  );

  async function fetchRequests() {

    try {

      const data =
        await getJoinRequests();

      setNotifications(data);

    } catch (error) {

      console.error(error);
    }
  }

  useEffect(() => {

    fetchRequests();

  }, []);

  async function handleApprove(
    requestId: number
  ) {

    try {

      await approveJoinRequest(
        requestId
      );

      setNotifications(
        (prev) =>
          prev.filter(
            (request) =>
              request.request_id !==
              requestId
          )
      );

      toast.success(
        "Request approved"
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to approve request"
      );
    }
  }

  async function handleReject(
    requestId: number
  ) {

    try {

      await rejectJoinRequest(
        requestId
      );

      setNotifications(
        (prev) =>
          prev.filter(
            (request) =>
              request.request_id !==
              requestId
          )
      );

      toast.success(
        "Request rejected"
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to reject request"
      );
    }
  }

  return (

    <div className="relative">

      <button
        onClick={() =>
          setOpen(!open)
        }

        className="relative p-2 rounded-lg hover:bg-zinc-800 transition"
      >

        <Bell size={22} />

        {notifications.length > 0 && (

          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full">

            {notifications.length}

          </span>
        )}

      </button>

      {open && (

        <div className="absolute right-0 mt-3 w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">

          <div className="p-4 border-b border-zinc-800 font-semibold text-lg">

            Join Requests

          </div>

          {notifications.length === 0 ? (

            <div className="p-6 text-zinc-500 text-center">

              No pending requests

            </div>

          ) : (

            <div className="max-h-[400px] overflow-y-auto">

              {notifications.map(
                (request) => (

                  <div
                    key={
                      request.request_id
                    }

                    className="p-4 border-b border-zinc-800"
                  >

                    <div className="mb-3 text-sm text-zinc-300 leading-relaxed">

                      <span className="font-semibold text-white">

                        {
                          request.username
                        }

                      </span>{" "}

                      requested access to{" "}

                      <span className="font-semibold text-white">

                        {
                          request.room_name
                        }

                      </span>

                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          handleApprove(
                            request.request_id
                          )
                        }

                        className="flex-1 bg-green-600 hover:bg-green-700 transition rounded-lg py-2 font-semibold"
                      >

                        Approve

                      </button>

                      <button
                        onClick={() =>
                          handleReject(
                            request.request_id
                          )
                        }

                        className="flex-1 bg-red-600 hover:bg-red-700 transition rounded-lg py-2 font-semibold"
                      >

                        Reject

                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}