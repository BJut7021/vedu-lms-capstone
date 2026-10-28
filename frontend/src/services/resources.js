export function resourceFormat(resource) {
  let path = "";
  try {
    path = new URL(resource.url || "", "https://vedu.local").pathname;
  } catch {
    /* Use the supplied resource type when the URL is not parseable. */
  }
  const extension =
    path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ||
    resource.title?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (extension === "pdf" || resource.type === "PDF")
    return { label: "PDF", description: "Tài liệu PDF", color: "#f45b69" };
  if (["ppt", "pptx", "odp"].includes(extension))
    return {
      label: "PPT",
      description: "Slide thuyết trình",
      color: "#438cf1",
    };
  if (["doc", "docx", "odt"].includes(extension))
    return { label: "DOC", description: "Tài liệu văn bản", color: "#26b77d" };
  if (["xls", "xlsx", "csv", "ods"].includes(extension))
    return { label: "XLS", description: "Bảng tính", color: "#159c75" };
  if (["html", "htm"].includes(extension))
    return {
      label: "WEB",
      description: "Bài giảng trực tuyến",
      color: "#8b69dc",
    };
  if (["mp4", "webm", "mov"].includes(extension) || resource.type === "VIDEO")
    return { label: "VID", description: "Video bài học", color: "#8069d8" };
  return resource.type === "LINK"
    ? { label: "LINK", description: "Liên kết học liệu", color: "#6291c6" }
    : { label: "FILE", description: "Tài liệu học tập", color: "#7c8fa9" };
}
