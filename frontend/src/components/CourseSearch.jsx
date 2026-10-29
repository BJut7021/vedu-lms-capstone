import { useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { api } from "../services/api";

export default function CourseSearch({
  mobile = false,
  onNavigate,
  onRefresh,
}) {
  const navigate = useNavigate(),
    [params] = useSearchParams(),
    id = useId();
  const [query, setQuery] = useState(params.get("q") || "");
  const [focused, setFocused] = useState(false),
    [active, setActive] = useState(-1);
  const [result, setResult] = useState({ query: "", items: [], error: false });
  const trimmed = query.trim();
  const open = focused && Array.from(trimmed).length >= 2;
  const items = result.query === trimmed ? result.items : [];
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .courseSuggestions(trimmed, controller.signal)
        .then((rows) => {
          if (alive)
            setResult({
              query: trimmed,
              items: rows.slice(0, 5),
              error: false,
            });
        })
        .catch(() => {
          if (alive) setResult({ query: trimmed, items: [], error: true });
        });
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, open]);
  const go = (path) => {
    setFocused(false);
    setActive(-1);
    onNavigate?.();
    navigate(path);
  };
  const search = (e) => {
    e.preventDefault();
    go(`/courses?${new URLSearchParams(trimmed ? { q: trimmed } : {})}`);
  };
  return (
    <form
      role="search"
      onSubmit={search}
      className={`relative ${mobile ? "w-full" : "w-full max-w-[330px]"}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <Search
        size={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={
          active >= 0 && items[active] ? `${id}-${active}` : undefined
        }
        aria-label={
          mobile
            ? "Tìm khóa học trên điện thoại"
            : "Tìm khóa học, chủ đề hoặc giảng viên"
        }
        value={query}
        maxLength={120}
        onChange={(e) => {
          setQuery(e.target.value);
          setFocused(true);
          setActive(-1);
        }}
        onFocus={() => {
          setFocused(true);
          onRefresh?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setFocused(false);
            setActive(-1);
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setFocused(true);
            if (items.length)
              setActive(
                (previous) =>
                  previous < 0 ? (e.key === "ArrowDown" ? 0 : items.length - 1) :
                  (previous + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length,
              );
          }
          if (e.key === "Enter" && open && items[active]) {
            e.preventDefault();
            go(`/courses/${items[active].id}`);
          }
        }}
        placeholder="Tìm khóa học…"
        className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-14 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />
      <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold text-blue-600">
        Tìm
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl">
          <div id={`${id}-list`} role="listbox" aria-label="Khóa học phù hợp">
            {items.map((course, i) => (
              <button
                type="button"
                role="option"
                id={`${id}-${i}`}
                aria-selected={active === i}
                key={course.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(`/courses/${course.id}`)}
                className={`flex w-full items-start gap-2 px-4 py-3 text-left text-sm leading-5 ${active === i ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-blue-50"}`}
              >
                <BookOpen size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <span>{course.title}</span>
              </button>
            ))}
          </div>
          {!items.length && (
            <p role="status" className="px-4 py-3 text-sm text-slate-500">
              {result.query !== trimmed
                ? "Đang tìm khóa học…"
                : result.error
                  ? "Chưa tải được gợi ý. Nhấn Enter để tìm kiếm."
                  : "Không có khóa học phù hợp."}
            </p>
          )}
          {!!items.length && (
            <button
              type="submit"
              className="w-full border-t border-slate-100 px-4 py-3 text-left text-xs font-bold text-blue-600"
            >
              Xem tất cả kết quả →
            </button>
          )}
        </div>
      )}
    </form>
  );
}
