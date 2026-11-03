import { BookOpenCheck, Lightbulb, Rocket, Sparkles } from "lucide-react";

function RailMessage({ icon: Icon, children, tone = "blue" }) {
  return (
    <div className={`home-rail-message home-rail-message-${tone}`}>
      <Icon size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default function HomeSideRails() {
  return (
    <div className="home-page-rails" aria-hidden="true">
      <aside className="home-page-rail home-page-rail-left">
        <img
          src="/images/learning/study-books.svg"
          alt=""
          width="220"
          height="340"
          className="home-rail-illustration"
        />
        <RailMessage icon={BookOpenCheck}>Học từng bước nhỏ</RailMessage>
        <div className="home-rail-orbit home-rail-orbit-blue">
          <span />
          <span />
          <span />
        </div>
        <p className="home-rail-handwriting">
          Better student
          <br />
          Brighter future
        </p>
        <RailMessage icon={Sparkles} tone="violet">
          Kiến thức mỗi ngày
        </RailMessage>
      </aside>

      <aside className="home-page-rail home-page-rail-right">
        <img
          src="/images/learning/study-laptop.svg"
          alt=""
          width="220"
          height="340"
          className="home-rail-illustration"
        />
        <RailMessage icon={Lightbulb} tone="amber">
          Khám phá kỹ năng mới
        </RailMessage>
        <div className="home-rail-orbit home-rail-orbit-violet">
          <span />
          <span />
          <span />
        </div>
        <p className="home-rail-handwriting home-rail-handwriting-right">
          Dream
          <br />
          Learn
          <br />
          Achieve
        </p>
        <RailMessage icon={Rocket}>Tiến bộ theo lộ trình</RailMessage>
      </aside>
    </div>
  );
}
