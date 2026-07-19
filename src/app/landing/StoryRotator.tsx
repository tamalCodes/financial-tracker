"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

const ROTATION_MS = 6500;
const SWIPE_THRESHOLD = 82;

const stories = [
  {
    name: "Meera Iyer",
    city: "Chennai",
    image: "/landing/testimonial-meera.png",
    area: "Bills + spending",
    quote: "I stopped trying to be perfect with money. I only had to be aware of it.",
    outcome: "Bills stay visible beside everyday spending.",
  },
  {
    name: "Aarav Sharma",
    city: "Bengaluru",
    image: "/landing/testimonial-aarav.png",
    area: "Monthly view",
    quote: "Now I can see where my salary goes before month-end surprises me.",
    outcome: "Earned, spent and left-in-bank share one view.",
  },
  {
    name: "Riya Kapoor",
    city: "Mumbai",
    image: "/landing/testimonial-riya.png",
    area: "SIPs + investing",
    quote: "My SIP no longer feels separate from the rest of my month.",
    outcome: "Future money stays part of today's plan.",
  },
  {
    name: "Kabir Nair",
    city: "Kochi",
    // Reusing an existing portrait for now; swap to a unique AI portrait at public/landing/testimonial-kabir.png later.
    image: "/landing/testimonial-aarav.png" as string | null,
    area: "EMIs + planning",
    quote: "My EMIs used to ambush me. Now they sit in plain sight, every single month.",
    outcome: "Commitments are planned, not discovered.",
  },
  {
    name: "Ananya Rao",
    city: "Hyderabad",
    // Reusing an existing portrait for now; swap to a unique AI portrait at public/landing/testimonial-ananya.png later.
    image: "/landing/testimonial-riya.png" as string | null,
    area: "Saving habit",
    quote: "I finally know what is truly mine to spend once everything is set aside.",
    outcome: "Left-in-bank reflects real, free money.",
  },
] as const;

function initialsOf(name: string) {
  return name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
}

// Deterministic rest pose for the cards sitting behind the front card, so the
// stack always looks the same instead of relying on Math.random().
const DEPTH_POSE = [
  { x: 0, y: 0, rot: 0, scale: 1 },
  { x: 20, y: 16, rot: 3.4, scale: 0.945 },
  { x: -16, y: 30, rot: -3.6, scale: 0.9 },
];

export default function StoryRotator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(query.matches);
    syncPreference();
    query.addEventListener("change", syncPreference);
    return () => query.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || dragging) return;
    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % stories.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex, paused, reducedMotion, dragging]);

  const advance = (direction: 1 | -1) => {
    setActiveIndex(current => (current + direction + stories.length) % stories.length);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStart.current = { id: event.pointerId, x: event.clientX };
    setDragging(true);
    setPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current || pointerStart.current.id !== event.pointerId) return;
    setDrag(event.clientX - pointerStart.current.x);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current || pointerStart.current.id !== event.pointerId) return;
    const delta = event.clientX - pointerStart.current.x;
    pointerStart.current = null;
    setDragging(false);
    setDrag(0);
    if (Math.abs(delta) > SWIPE_THRESHOLD) advance(delta < 0 ? 1 : -1);
  };

  return (
    <div
      className={styles.storyRotator}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div
        className={styles.storyDeck}
        data-dragging={dragging ? "" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {stories.map((story, index) => {
          const depth = (index - activeIndex + stories.length) % stories.length;
          const isFront = depth === 0;
          const pose = DEPTH_POSE[depth] ?? DEPTH_POSE[DEPTH_POSE.length - 1];
          const x = pose.x + (isFront ? drag : 0);
          const rot = pose.rot + (isFront ? drag * 0.028 : 0);
          const transform = `translate3d(${x}px, ${pose.y}px, 0) scale(${pose.scale}) rotate(${rot}deg)`;

          return (
            <article
              aria-hidden={isFront ? undefined : "true"}
              className={styles.storyCard}
              key={story.name}
              style={{
                transform,
                zIndex: stories.length - depth,
                opacity: depth > 2 ? 0 : 1,
                transition: dragging && isFront ? "none" : undefined,
              }}
            >
              <div className={styles.personCardTop}>
                <span>{story.area}</span>
                <small>STORY {String(index + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}</small>
              </div>
              <p className={styles.featuredQuote}>“{story.quote}”</p>
              <div className={styles.featuredPerson}>
                {story.image
                  ? <Image src={story.image} alt={`Portrait of fictional Kharcha member ${story.name}`} width={112} height={112} draggable={false} />
                  : <span className={styles.storyAvatar} aria-hidden="true">{initialsOf(story.name)}</span>}
                <div><strong>{story.name}</strong><small>{story.city}</small></div>
                <p>{story.outcome}</p>
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.storyControls} aria-label="Choose a member story">
        {stories.map((item, index) => (
          <button
            aria-label={`Show ${item.name}'s story`}
            aria-pressed={index === activeIndex}
            className={index === activeIndex ? styles.storyControlActive : ""}
            key={item.name}
            onClick={() => setActiveIndex(index)}
            type="button"
          ><span style={{ animationDuration: `${ROTATION_MS}ms`, animationPlayState: paused || dragging ? "paused" : "running" }} /></button>
        ))}
      </div>
    </div>
  );
}
