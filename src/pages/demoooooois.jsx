import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";

export default function MediaEffect() {
  const rootRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(InertiaPlugin);

    let oldX = 0;
    let oldY = 0;
    let deltaX = 0;
    let deltaY = 0;

    const root = rootRef.current;

    const mouseMoveHandler = (e) => {
      deltaX = e.clientX - oldX;
      deltaY = e.clientY - oldY;

      oldX = e.clientX;
      oldY = e.clientY;
    };

    root.addEventListener("mousemove", mouseMoveHandler);

    const medias = root.querySelectorAll(".media");

    const handlers = [];

    medias.forEach((el) => {
      const handler = () => {
        const image = el.querySelector("img");

        const tl = gsap.timeline({
          onComplete: () => tl.kill(),
        });

        tl.timeScale(1.2);

        tl.to(image, {
          inertia: {
            x: { velocity: deltaX * 30, end: 0 },
            y: { velocity: deltaY * 30, end: 0 },
          },
        });

        tl.fromTo(
          image,
          { rotate: 0 },
          {
            duration: 0.4,
            rotate: (Math.random() - 0.5) * 30,
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut",
          },
          "<"
        );
      };

      el.addEventListener("mouseenter", handler);
      handlers.push({ el, handler });
    });

    return () => {
      root.removeEventListener("mousemove", mouseMoveHandler);
      handlers.forEach(({ el, handler }) =>
        el.removeEventListener("mouseenter", handler)
      );
    };
  }, []);

  const images = Array.from({ length: 12 }, (_, i) =>
    `/assets/medias/${String(i + 1).padStart(2, "0")}.png`
  );

  return (
    <>
      {/* ---------- CSS ---------- */}
      <style>{`
        .mwg_effect000 {
          height: 100vh;
          overflow: hidden;
          position: relative;
          display: grid;
          place-items: center;
        }

        .header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          border-bottom: 1px solid #323232;
          padding: 20px 25px;
          color: #BAB8B9;
        }

        .header div:nth-child(2) {
          font-size: 26px;
        }

        .header div:last-child {
          display: flex;
          justify-content: flex-end;
        }

        .button {
          font-size: 14px;
          text-transform: uppercase;
          border-radius: 24px;
          height: 48px;
          gap: 5px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          width: max-content;
        }

        .button1 {
          background-color: #232323;
        }

        .button2 {
          border: 1px solid #323232;
        }

        .button img {
          width: 22px;
        }

        .medias {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1vw;
        }

        .medias img {
          width: 11vw;
          height: 11vw;
          object-fit: contain;
          border-radius: 4%;
          display: block;
          pointer-events: none;
          will-change: transform;
        }

        @media (max-width: 768px) {
          .header {
            padding: 15px;
            display: flex;
            justify-content: space-between;
          }

          .header div:nth-child(2) {
            display: none;
          }

          .medias {
            gap: 2vw;
          }

          .medias img {
            width: 18vw;
            height: 18vw;
          }
        }
      `}</style>

      {/* ---------- JSX ---------- */}
      <section ref={rootRef} className="mwg_effect000">
        <div className="header">
          <div>
            <p className="button button1">
              <img src="/assets/medias/01.png" alt="" />
              <span>3d & stuff</span>
            </p>
          </div>

          <div>12 items saved in your collection</div>

          <div>
            <p className="button button2">Add more</p>
          </div>
        </div>

        <div className="medias">
          {images.map((src, i) => (
            <div key={i} className="media">
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
