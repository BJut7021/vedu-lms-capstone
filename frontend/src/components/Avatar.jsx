import { useState } from "react";
export default function Avatar({ user, className = "h-10 w-10" }) {
  const [failed, setFailed] = useState("");
  return user?.avatarUrl && failed !== user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={`Ảnh đại diện ${user.fullName || ""}`}
      onError={() => setFailed(user.avatarUrl)}
      className={`${className} shrink-0 rounded-full object-cover ring-2 ring-white/80`}
    />
  ) : (
    <span
      aria-label={`Ảnh đại diện ${user?.fullName || ""}`}
      className={`${className} grid shrink-0 place-items-center rounded-full bg-blue-100 font-bold text-blue-700`}
    >
      {user?.fullName?.trim().charAt(0) || "V"}
    </span>
  );
}
