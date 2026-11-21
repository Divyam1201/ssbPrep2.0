"use client";

import { useEffect, useState } from "react";

import { AdminLoginModal } from "./AdminLoginModal";
import { AdminUploadModal } from "./AdminUploadModal";
import type { ModuleType } from "@/server/services/setService";

export interface AdminSetManagerProps {
  currentModule: ModuleType;
  onSetUploaded?: () => void;
}

export function AdminSetManager({
  currentModule,
  onSetUploaded,
}: AdminSetManagerProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setIsAdmin(Boolean(data.isAdmin));
        } else if (!ignore) {
          setIsAdmin(false);
        }
      } catch {
        if (!ignore) setIsAdmin(false);
      } finally {
        if (!ignore) setIsCheckingSession(false);
      }
    };

    void checkSession();

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAdmin(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (isCheckingSession) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-[#282f2c] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              isAdmin ? "bg-emerald-400" : "bg-[#8c8273]"
            }`}
          />
          <span className="text-[#8c8273]">
            {isAdmin ? "Signed in as Admin" : "Public access · View-only"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="rounded-lg bg-[#5d6b4f] px-3 py-1.5 font-semibold text-[#f4efe6] transition hover:bg-[#7c8e6a]"
              >
                + Upload new set
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-[#282f2c] px-3 py-1.5 font-medium text-[#c2b9a7] transition hover:bg-[#1e2321]"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="rounded-lg border border-[#282f2c] px-3 py-1.5 font-medium text-[#c2b9a7] transition hover:border-[#cba358] hover:text-[#f4efe6]"
            >
              Login as admin
            </button>
          )}
        </div>
      </div>

      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
        }}
      />

      <AdminUploadModal
        isOpen={isUploadOpen}
        initialModule={currentModule}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          onSetUploaded?.();
        }}
      />
    </div>
  );
}
