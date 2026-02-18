"use client";

import { FormEvent, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Toast from "@/src/components/Toast";
import { updateMyProfile } from "@/src/services/profile";

type ToastTone = "success" | "warning" | "error" | "info";

interface ProfileProps {
  initialProfile?: {
    name: string;
    username: string;
  };
}

function parseError(error: string) {
  try {
    const parsed = JSON.parse(error) as { message?: string; error?: string };
    return parsed.message || parsed.error || error;
  } catch {
    return error;
  }
}

export default function Profile({ initialProfile }: ProfileProps) {
  const { user, isLoading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("success");

  const userPreferredUsername = useMemo(() => {
    if (!user) {
      return "";
    }

    const preferredUsername = (user as Record<string, unknown>)[
      "preferred_username"
    ];
    if (typeof preferredUsername === "string") {
      return preferredUsername;
    }

    return user.nickname || "";
  }, [user]);

  const showToast = (message: string, tone: ToastTone = "success") => {
    setToastTone(tone);
    setToastMessage(message);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = nameInput.trim();
    const username = usernameInput.trim();

    if (!name || !username) {
      showToast("Name and username are required.", "warning");
      return;
    }

    setIsSaving(true);
    const result = await updateMyProfile({ name, username });
    setIsSaving(false);

    if (result.error) {
      showToast(parseError(result.error), "error");
      return;
    }

    setSavedName(result.data?.name || name);
    setSavedUsername(result.data?.username || username);
    setIsEditing(false);
    showToast("Profile updated.");
  };

  const displayName = savedName || initialProfile?.name || user?.name || "User";
  const displayUsername =
    savedUsername || initialProfile?.username || userPreferredUsername;

  const beginEdit = () => {
    setNameInput(displayName);
    setUsernameInput(displayUsername);
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-text">Loading user profile...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="profile-card action-card">
        <img
          src={
            user.picture ||
            `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2363b3ed'/%3E%3Cpath d='M50 45c7.5 0 13.64-6.14 13.64-13.64S57.5 17.72 50 17.72s-13.64 6.14-13.64 13.64S42.5 45 50 45zm0 6.82c-9.09 0-27.28 4.56-27.28 13.64v3.41c0 1.88 1.53 3.41 3.41 3.41h47.74c1.88 0 3.41-1.53 3.41-3.41v-3.41c0-9.08-18.19-13.64-27.28-13.64z' fill='%23fff'/%3E%3C/svg%3E`
          }
          alt={displayName || "User profile"}
          className="profile-picture"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2363b3ed'/%3E%3Cpath d='M50 45c7.5 0 13.64-6.14 13.64-13.64S57.5 17.72 50 17.72s-13.64 6.14-13.64 13.64S42.5 45 50 45zm0 6.82c-9.09 0-27.28 4.56-27.28 13.64v3.41c0 1.88 1.53 3.41 3.41 3.41h47.74c1.88 0 3.41-1.53 3.41-3.41v-3.41c0-9.08-18.19-13.64-27.28-13.64z' fill='%23fff'/%3E%3C/svg%3E`;
          }}
        />

        {!isEditing ? (
          <div className="profile-content">
            <h2 className="profile-name">{displayName}</h2>
            <p className="profile-email">{user.email}</p>
            {displayUsername ? (
              <p className="profile-username">@{displayUsername}</p>
            ) : null}
            <button
              type="button"
              className="profile-edit-button"
              onClick={beginEdit}
            >
              Edit profile
            </button>
          </div>
        ) : (
          <form className="profile-edit-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                disabled={isSaving}
                maxLength={80}
              />
            </label>
            <label className="field">
              <span>Username</span>
              <input
                value={usernameInput}
                onChange={(event) => setUsernameInput(event.target.value)}
                disabled={isSaving}
                maxLength={60}
              />
            </label>
            <div className="profile-edit-actions">
              <button type="submit" className="action-save" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameInput(displayName);
                  setUsernameInput(displayUsername);
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {toastMessage ? (
        <Toast
          message={toastMessage}
          tone={toastTone}
          onDismiss={() => setToastMessage(null)}
        />
      ) : null}
    </>
  );
}
