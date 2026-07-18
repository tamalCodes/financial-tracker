"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export default function LandingMotion() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-landing-nav]");
    const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
    const menu = document.querySelector<HTMLElement>("[data-nav-menu]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let menuPinned = false;

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
      if (nav?.classList.contains("landing-nav-compact")) setMenu(true, false);
    };
    const onLeave = () => {
      if (!menuPinned) setMenu(false, false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false, false);
    };
    const onMenuClick = (event: Event) => {
      if ((event.target as HTMLElement).closest("a")) setMenu(false, false);
    };

    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
    toggle?.addEventListener("click", onToggle);
    nav?.addEventListener("mouseenter", onEnter);
    nav?.addEventListener("mouseleave", onLeave);
    menu?.addEventListener("click", onMenuClick);
    window.addEventListener("keydown", onKeyDown);

    if (reducedMotion.matches) {
      return () => {
        window.removeEventListener("scroll", updateNav);
        toggle?.removeEventListener("click", onToggle);
        nav?.removeEventListener("mouseenter", onEnter);
        nav?.removeEventListener("mouseleave", onLeave);
        menu?.removeEventListener("click", onMenuClick);
        window.removeEventListener("keydown", onKeyDown);
      };
    }

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
      lenis.destroy();
      window.removeEventListener("scroll", updateNav);
      toggle?.removeEventListener("click", onToggle);
      nav?.removeEventListener("mouseenter", onEnter);
      nav?.removeEventListener("mouseleave", onLeave);
      menu?.removeEventListener("click", onMenuClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
