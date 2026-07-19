"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./landing.module.css";

const ROTATION_MS = 6500;

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
] as const;

export default function StoryRotator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(query.matches);
    syncPreference();
    query.addEventListener("change", syncPreference);
    return () => query.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % stories.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex, paused, reducedMotion]);

  const story = stories[activeIndex];

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
      <article className={styles.featuredStory} key={story.name}>
        <div className={styles.personCardTop}>
          <span>{story.area}</span>
          <small>STORY {String(activeIndex + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}</small>
        </div>
        <p className={styles.featuredQuote}>“{story.quote}”</p>
        <div className={styles.featuredPerson}>
          <Image src={story.image} alt={`Portrait of fictional Kharcha member ${story.name}`} width={112} height={112}/>
          <div><strong>{story.name}</strong><small>{story.city}</small></div>
          <p>{story.outcome}</p>
        </div>
      </article>
      <div className={styles.storyControls} aria-label="Choose a member story">
        {stories.map((item, index) => (
          <button
            aria-label={`Show ${item.name}'s story`}
            aria-pressed={index === activeIndex}
            className={index === activeIndex ? styles.storyControlActive : ""}
            key={item.name}
            onClick={() => setActiveIndex(index)}
            type="button"
          ><span style={{ animationDuration: `${ROTATION_MS}ms`, animationPlayState: paused ? "paused" : "running" }}/></button>
        ))}
      </div>
    </div>
  );
}
