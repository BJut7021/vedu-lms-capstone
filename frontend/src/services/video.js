export function youtubeId(url) {
  try {
    const u = new URL(url);
    const id =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : [
              "youtube.com",
              "www.youtube.com",
              "www.youtube-nocookie.com",
            ].includes(u.hostname)
          ? u.searchParams.get("v") || u.pathname.split("/embed/")[1]
          : null;
    return /^[\w-]{11}$/.test(id || "") ? id : null;
  } catch {
    return null;
  }
}
