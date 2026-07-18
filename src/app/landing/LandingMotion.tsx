"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

export default function LandingMotion() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-landing-nav]");
    const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
    const menu = document.querySelector<HTMLElement>("[data-nav-menu]");
    const heroVisual = document.querySelector<HTMLElement>("[data-hero-visual]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let menuPinned = false;
    let heroFrame = 0;
    let menuCloseFrame = 0;

    const setMenu = (open: boolean, pinned = menuPinned) => {
      menuPinned = pinned;
      nav?.classList.toggle("landing-nav-expanded", open);
      toggle?.setAttribute("aria-expanded", String(open));
      toggle?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menu?.setAttribute("aria-hidden", String(!open));
    };

    const updateNav = () => {
      const compact = window.scrollY > 72;
      nav?.classList.toggle("landing-nav-compact", compact);
      if (nav) {
        const rect = nav.getBoundingClientRect();
        const beneath = document
          .elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
          .find((element) => element !== nav && !nav.contains(element));
        nav.classList.toggle(
          "landing-nav-on-dark",
          Boolean(beneath?.closest('[data-nav-tone="dark"]')),
        );
      }
      if (!compact) setMenu(false, false);
    };
    const onToggle = () => setMenu(!nav?.classList.contains("landing-nav-expanded"), !nav?.classList.contains("landing-nav-expanded"));
    const onEnter = () => {
      window.clearTimeout(menuCloseFrame);
      if (nav?.classList.contains("landing-nav-compact") && !nav.classList.contains("landing-nav-expanded")) setMenu(true, false);
    };
    const onLeave = () => {
      if (!menuPinned) {
        window.clearTimeout(menuCloseFrame);
        menuCloseFrame = window.setTimeout(() => setMenu(false, false), 220);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false, false);
    };
    const onMenuClick = (event: Event) => {
      if ((event.target as HTMLElement).closest("a")) setMenu(false, false);
    };
    const onHeroMove = (event: PointerEvent) => {
      if (!heroVisual || reducedMotion.matches) return;
      const rect = heroVisual.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      cancelAnimationFrame(heroFrame);
      heroFrame = requestAnimationFrame(() => {
        heroVisual.style.setProperty("--hero-shift-x", `${(x * 8).toFixed(2)}px`);
        heroVisual.style.setProperty("--hero-shift-y", `${(y * 8).toFixed(2)}px`);
        heroVisual.style.setProperty("--hero-card-x", `${(x * -12).toFixed(2)}px`);
        heroVisual.style.setProperty("--hero-card-y", `${(y * -10).toFixed(2)}px`);
        heroVisual.style.setProperty("--hero-coin-x", `${(x * -15).toFixed(2)}px`);
        heroVisual.style.setProperty("--hero-coin-y", `${(y * -12).toFixed(2)}px`);
        heroVisual.style.setProperty("--hero-tilt-x", `${(y * -1.5).toFixed(2)}deg`);
        heroVisual.style.setProperty("--hero-tilt-y", `${(x * 1.8).toFixed(2)}deg`);
      });
    };
    const resetHero = () => {
      ["--hero-shift-x", "--hero-shift-y", "--hero-card-x", "--hero-card-y", "--hero-coin-x", "--hero-coin-y"].forEach((property) => heroVisual?.style.setProperty(property, "0px"));
      ["--hero-tilt-x", "--hero-tilt-y"].forEach((property) => heroVisual?.style.setProperty(property, "0deg"));
    };

    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
    toggle?.addEventListener("click", onToggle);
    nav?.addEventListener("mouseenter", onEnter);
    nav?.addEventListener("mouseleave", onLeave);
    menu?.addEventListener("mouseenter", onEnter);
    menu?.addEventListener("mouseleave", onLeave);
    menu?.addEventListener("click", onMenuClick);
    window.addEventListener("keydown", onKeyDown);
    heroVisual?.addEventListener("pointermove", onHeroMove);
    heroVisual?.addEventListener("pointerleave", resetHero);

    if (reducedMotion.matches) {
      return () => {
        window.removeEventListener("scroll", updateNav);
        toggle?.removeEventListener("click", onToggle);
        nav?.removeEventListener("mouseenter", onEnter);
        nav?.removeEventListener("mouseleave", onLeave);
        menu?.removeEventListener("mouseenter", onEnter);
        menu?.removeEventListener("mouseleave", onLeave);
        menu?.removeEventListener("click", onMenuClick);
        window.removeEventListener("keydown", onKeyDown);
        heroVisual?.removeEventListener("pointermove", onHeroMove);
        heroVisual?.removeEventListener("pointerleave", resetHero);
        cancelAnimationFrame(heroFrame);
        window.clearTimeout(menuCloseFrame);
      };
    }

    gsap.registerPlugin(ScrollTrigger);
    const motion = gsap.matchMedia();
    const chapterPanels = gsap.utils.toArray<HTMLElement>("[data-chapter-panel]");
    const depthFollowup = document.querySelector<HTMLElement>("[data-depth-followup]");

    motion.add("(min-width: 801px)", () => {
      chapterPanels.forEach((panel) => {
        gsap.fromTo(
          panel,
          {
            clipPath: "inset(0 2.4% 0 2.4% round 54px 54px 0 0)",
            rotationX: 3.2,
            scale: 0.965,
            y: 92,
          },
          {
            clipPath: "inset(0 0% 0 0% round 38px 38px 0 0)",
            ease: "none",
            rotationX: 0,
            scale: 1,
            scrollTrigger: {
              trigger: panel,
              start: "top 98%",
              end: "top 24%",
              scrub: 1.15,
            },
            y: 0,
          },
        );
      });

      if (depthFollowup) {
        gsap.fromTo(
          depthFollowup,
          { y: 96 },
          {
            ease: "none",
            scrollTrigger: {
              trigger: depthFollowup,
              start: "top 100%",
              end: "top 14%",
              scrub: 1.1,
            },
            y: 0,
          },
        );
      }
    });

    motion.add("(max-width: 800px)", () => {
      chapterPanels.forEach((panel) => {
        gsap.fromTo(panel, { y: 48 }, {
          ease: "none",
          scrollTrigger: { trigger: panel, start: "top 98%", end: "top 62%", scrub: 0.75 },
          y: 0,
        });
      });
      if (depthFollowup) {
        gsap.fromTo(depthFollowup, { y: 64 }, {
          ease: "none",
          scrollTrigger: { trigger: depthFollowup, start: "top 100%", end: "top 64%", scrub: 0.8 },
          y: 0,
        });
      }
    });

    ScrollTrigger.refresh();

    const lenis = new Lenis({
      autoRaf: true,
      anchors: { offset: -104 },
      duration: 1.08,
      easing: (value) => 1 - Math.pow(1 - value, 4),
      lerp: 0.085,
      smoothWheel: true,
      touchMultiplier: 1.1,
      wheelMultiplier: 0.9,
    });

    return () => {
      motion.revert();
      lenis.destroy();
      window.removeEventListener("scroll", updateNav);
      toggle?.removeEventListener("click", onToggle);
      nav?.removeEventListener("mouseenter", onEnter);
      nav?.removeEventListener("mouseleave", onLeave);
      menu?.removeEventListener("mouseenter", onEnter);
      menu?.removeEventListener("mouseleave", onLeave);
      menu?.removeEventListener("click", onMenuClick);
      window.removeEventListener("keydown", onKeyDown);
      heroVisual?.removeEventListener("pointermove", onHeroMove);
      heroVisual?.removeEventListener("pointerleave", resetHero);
      cancelAnimationFrame(heroFrame);
      window.clearTimeout(menuCloseFrame);
    };
  }, []);

  return null;
}
