"use client";

import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import DynamicIslandNavbar from "@/components/dynamicIslandNavbar";
import { isAuthenticated } from "@/app/(auth)/api/check-auth";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const authUser = isAuthenticated();
    setUser(authUser);

    if (authUser && authUser.fullname) {
      // Check if the toast has already been shown
      const toastShown = localStorage.getItem("toastShown");

      if (!toastShown) {
        toast(`Hello ${authUser.fullname}!`, {
          icon: "👏",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
        // Set the toastShown flag in local storage
        localStorage.setItem("toastShown", "true");
      }
    } else {
      toast(
        (t) => (
          <span>
            Hi there! Please <b>login</b> or <b>register</b>.
            <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
          </span>
        ),
        {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }
      );
    }
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <DynamicIslandNavbar user={user} />
      {children}
    </>
  );
};

export default ClientLayout;
