"use client";

import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NotFoundPageProps = {
  title?: string;
  code?: string;
  description?: string;
  fullscreen?: boolean;
  hideActions?: boolean;
  showDecorations?: boolean;
  className?: string;
};

type StickFigure = {
  top?: string;
  bottom?: string;
  src: string;
  transform?: string;
  speedX: number;
  speedRotation?: number;
};

interface CircleParticle {
  x: number;
  y: number;
  size: number;
}

export default function NotFoundPage({
  title = "Page Not Found",
  code = "404",
  description = "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
  fullscreen = true,
  hideActions = false,
  showDecorations = true,
  className = "",
}: NotFoundPageProps) {
  return (
    <div
      className={`w-full ${fullscreen ? "h-screen" : "h-full min-h-[220px]"} overflow-x-hidden flex justify-center items-center relative ${className}`.trim()}
    >
      <MessageDisplay
        title={title}
        code={code}
        description={description}
        fullscreen={fullscreen}
        hideActions={hideActions}
      />
      {showDecorations ? (
        <>
          <CharactersAnimation />
          <CircleAnimation />
        </>
      ) : null}
    </div>
  );
}

function MessageDisplay({
  title,
  code,
  description,
  fullscreen,
  hideActions,
}: {
  title: string;
  code: string;
  description: string;
  fullscreen: boolean;
  hideActions: boolean;
}) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 550);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute flex flex-col justify-center items-center w-[90%] h-[90%] z-[100]">
      <div
        className={`flex flex-col items-center transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className={`font-semibold text-[color:var(--text-secondary)] m-[1%] z-10 ${fullscreen ? "text-[35px]" : "text-[18px]"}`}>
          {title}
        </div>
        <div className={`font-bold text-[color:var(--text-primary)] m-[1%] z-10 ${fullscreen ? "text-[80px]" : "text-[42px]"}`}>
          {code}
        </div>
        <div
          className={`text-center text-[color:var(--text-muted)] m-[1%] z-10 ${
            fullscreen ? "text-[15px] w-1/2 min-w-[40%]" : "text-[12px] w-full px-4"
          }`}
        >
          {description}
        </div>
        {!hideActions ? (
          <div className="flex gap-4 mt-8 flex-wrap justify-center">
            <button
              onClick={() => router.back()}
              className="group text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300 ease-in-out px-6 py-2 h-auto text-base font-medium flex items-center gap-2 hover:scale-105"
            >
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              Go Back
            </button>
            <button
              onClick={() => router.push("/")}
              className="group bg-black text-white hover:bg-gray-900 transition-all duration-300 ease-in-out px-6 py-2 h-auto text-base font-medium flex items-center gap-2 hover:scale-105"
            >
              <Home size={18} className="transition-transform group-hover:translate-x-1" />
              Go Home
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CharactersAnimation() {
  const charactersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!charactersRef.current) return;
    const container = charactersRef.current;

    const stickFigures: StickFigure[] = [
      {
        top: "0%",
        src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80",
        transform: "rotateZ(-90deg)",
        speedX: 2000,
      },
      {
        top: "10%",
        src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&h=240&q=80",
        speedX: 3200,
        speedRotation: 2600,
      },
      {
        top: "20%",
        src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&h=240&q=80",
        speedX: 4800,
        speedRotation: 1800,
      },
      {
        top: "25%",
        src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&h=240&q=80",
        speedX: 3000,
        speedRotation: 1600,
      },
      {
        top: "35%",
        src: "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=240&h=240&q=80",
        speedX: 2400,
        speedRotation: 900,
      },
      {
        bottom: "5%",
        src: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=240&h=240&q=80",
        speedX: 0,
      },
    ];

    const render = () => {
      container.innerHTML = "";

      stickFigures.forEach((figure, index) => {
        const stick = document.createElement("img");
        stick.classList.add("characters");
        stick.style.position = "absolute";
        stick.style.width = "18%";
        stick.style.height = "18%";
        stick.style.objectFit = "cover";
        stick.style.borderRadius = "999px";
        stick.style.opacity = "0.82";
        stick.style.filter = "grayscale(100%) contrast(140%)";

        if (figure.top) stick.style.top = figure.top;
        if (figure.bottom) stick.style.bottom = figure.bottom;

        stick.src = figure.src;
        if (figure.transform) stick.style.transform = figure.transform;

        container.appendChild(stick);
        if (index === 5) return;

        stick.animate([{ left: "100%" }, { left: "-20%" }], {
          duration: figure.speedX,
          easing: "linear",
          fill: "forwards",
        });

        if (index === 0 || !figure.speedRotation) return;
        stick.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }], {
          duration: figure.speedRotation,
          iterations: Infinity,
          easing: "linear",
        });
      });
    };

    render();
    window.addEventListener("resize", render);
    return () => {
      window.removeEventListener("resize", render);
      container.innerHTML = "";
    };
  }, []);

  return <div ref={charactersRef} className="absolute w-[99%] h-[95%]" />;
}

function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const timerRef = useRef(0);
  const circlesRef = useRef<CircleParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initArr = () => {
      circlesRef.current = [];

      for (let index = 0; index < 300; index += 1) {
        const randomX =
          Math.floor(Math.random() * (canvas.width * 3 - canvas.width * 1.2 + 1)) +
          canvas.width * 1.2;
        const randomY =
          Math.floor(Math.random() * (canvas.height - (canvas.height * -0.2 + 1))) +
          canvas.height * -0.2;
        const size = canvas.width / 1000;
        circlesRef.current.push({ x: randomX, y: randomY, size });
      }
    };

    const draw = () => {
      const context = canvas.getContext("2d");
      if (!context) return;

      timerRef.current += 1;
      context.setTransform(1, 0, 0, 1, 0, 0);

      const distanceX = canvas.width / 80;
      const growthRate = canvas.width / 1000;

      context.fillStyle = "rgba(125, 211, 252, 0.4)";
      context.clearRect(0, 0, canvas.width, canvas.height);

      circlesRef.current.forEach((circle) => {
        context.beginPath();

        if (timerRef.current < 65) {
          circle.x -= distanceX;
          circle.size += growthRate;
        }

        if (timerRef.current > 65 && timerRef.current < 500) {
          circle.x -= distanceX * 0.02;
          circle.size += growthRate * 0.2;
        }

        context.arc(circle.x, circle.y, circle.size, 0, 360);
        context.fill();
      });

      if (timerRef.current > 500) {
        if (requestIdRef.current !== null) {
          cancelAnimationFrame(requestIdRef.current);
        }
        return;
      }

      requestIdRef.current = requestAnimationFrame(draw);
    };

    const start = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      canvas.height = parent ? parent.clientHeight : window.innerHeight;
      timerRef.current = 0;
      if (requestIdRef.current !== null) {
        cancelAnimationFrame(requestIdRef.current);
      }
      initArr();
      draw();
    };

    start();
    window.addEventListener("resize", start);

    return () => {
      window.removeEventListener("resize", start);
      if (requestIdRef.current !== null) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
