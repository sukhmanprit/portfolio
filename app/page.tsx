"use client";

/**
 * page.tsx
 *
 * Single-file portfolio page for Next.js (App Router).
 * This file intentionally keeps everything together so it's easy to read and copy to GitHub:
 * 1) Data models (types)
 * 2) Small hooks/utilities
 * 3) UI primitives (Container, Card, Section, Tags, Skills)
 * 4) Page content (skills, projects, experience)
 * 5) Render layout (Hero, Skills, Projects, Experience, Contact)
 *
 * Styling:
 * - Tailwind utilities are used for layout/spacing/typography.
 * - Theme colors come from CSS variables in globals.css (light/dark tokens).
 * - Project tech uses neutral tags to reduce purple intensity.
 * - Skills are displayed as compact name-only lists to stay scannable.
 */

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Allowed project categories used for the small category label on project cards.
 * Keeping this as a union makes the data consistent and prevents typos.
 */
type ProjectCategory = "Full-stack" | "Cloud" | "ML" | "Analytics" | "Documentation";

/**
 * Featured projects appear in the main "Projects" grid (2 columns on desktop).
 * - "featured" changes the card variant for slightly more emphasis.
 * - "tech" becomes a list of neutral Tag pills.
 */
type Project = {
  title: string;
  category: ProjectCategory;
  summary: string;
  result?: string;
  tech: string[];
  href?: string;
  featured?: boolean;
};

/**
 * Mini projects are grouped under "Applied ML and Computer Vision".
 * This type mirrors Project, but without category/featured.
 */
type GroupedProject = {
  title: string;
  summary: string;
  result?: string;
  tech: string[];
  href?: string;
};

/**
 * Skill groups are rendered as cards, each card shows:
 * - a group title (example: Data and Analytics)
 * - a compact grid of skill names only (no extra bullet paragraphs)
 */
type SkillGroup = {
  title: string;
  skills: string[];
};

/**
 * Work experience model used by the Experience section.
 * This keeps the UI rendering consistent and easy to update later.
 */
type Experience = {
  org: string;
  role: string;
  meta: string;
  when: string;
  points: string[];
};

/**
 * Props for the reusable <Section /> wrapper component.
 * - "band" toggles a subtle background band so sections feel separated.
 */
type SectionProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
  band?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                          Hooks and Small Utilities                          */
/* -------------------------------------------------------------------------- */

/**
 * useReveal()
 * Adds a scroll-based reveal animation using IntersectionObserver.
 *
 * How it works:
 * - Attach returned "ref" to an element.
 * - When it enters the viewport, "shown" becomes true once and stays true.
 * - We disconnect the observer to avoid extra work after reveal.
 *
 * Why:
 * - Lightweight animation without libraries.
 * - Improves perceived polish without affecting content.
 */
function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.14 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, shown };
}

/**
 * cx()
 * A tiny className joiner. Helps keep Tailwind strings readable.
 * Example: cx("base", condition && "optional")
 */
function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*                               UI Primitives                                 */
/* -------------------------------------------------------------------------- */

/**
 * Container
 * Centralizes page content and applies responsive padding.
 * Keeps all sections aligned to the same max width.
 */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

type CardVariant = "soft" | "default" | "featured" | "outline";

/**
 * Card
 * Reusable surface component used for skill cards, project cards, and content panels.
 *
 * Variants:
 * - soft: lighter shadow and softer background tint (good for About/Contact)
 * - default: standard card look
 * - featured: slightly stronger emphasis for highlighted projects
 * - outline: minimal surface used in Experience to reduce visual noise
 *
 * Note:
 * - Colors come from CSS variables (globals.css) so light/dark stays consistent.
 */
function Card({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
}) {
  const base = "rounded-3xl border border-border bg-card p-7 transition-all duration-300";
  const lift = "hover:-translate-y-1 hover:shadow-[0_28px_80px_-44px_rgba(0,0,0,0.55)]";

  const variants: Record<CardVariant, string> = {
    soft: cx(
      "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.28)]",
      "hover:shadow-[0_18px_44px_-34px_rgba(0,0,0,0.34)]",
      "bg-gradient-to-b from-card to-[color:var(--accent-soft-2)]"
    ),
    default: cx(
      "shadow-[0_14px_40px_-30px_rgba(0,0,0,0.32)]",
      "bg-gradient-to-b from-card to-[color:var(--accent-soft-2)]"
    ),
    featured: cx(
      "shadow-[0_18px_56px_-36px_rgba(0,0,0,0.46)]",
      "bg-gradient-to-b from-card to-[color:var(--accent-soft)]",
      "border-[color:var(--border)]"
    ),
    outline: cx("shadow-none", "bg-transparent", "hover:bg-[color:var(--accent-soft-2)]"),
  };

  // "outline" cards should not lift, because the Experience section is list-like.
  const motion = variant === "outline" ? "" : lift;

  return <div className={cx(base, variants[variant], motion, className)}>{children}</div>;
}

/**
 * Tag
 * Neutral tech label used under projects.
 *
 * Purpose:
 * - Shows tech stack clearly
 * - Avoids heavy purple blocks by using neutral tag tokens from globals.css
 * - Still provides a nice hover state for interactivity
 */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1",
        "text-[11px] font-medium tracking-tight",
        "border",
        "bg-[color:var(--tag-bg)] text-[color:var(--tag-text)] border-[color:var(--tag-border)]",
        "transition-colors",
        "hover:bg-[color:var(--accent-soft-2)] hover:text-[color:var(--foreground)] hover:border-border"
      )}
    >
      {children}
    </span>
  );
}

/**
 * SkillsGrid
 * A compact, multi-column list for skill names only.
 *
 * Design goal:
 * - Same content (all skills)
 * - Less text density than paragraphs/bullets
 * - Scans quickly like a resume "Skills" section
 */
function SkillsGrid({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/85 sm:grid-cols-3">
      {items.map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-alt)]" />
          <span className="leading-tight">{s}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Section
 * Standard wrapper for each page section.
 *
 * Features:
 * - Optional banded background (subtle separation)
 * - Title bar with accent line
 * - Reveal animation using useReveal()
 */
function Section({ id, title, children, band }: SectionProps) {
  const { ref, shown } = useReveal();

  return (
    <section id={id} className={cx("py-12 sm:py-16", band ? "bg-[color:var(--muted)]/50" : "")}>
      <Container>
        <div
          ref={ref}
          className={cx(
            "transition-all duration-700",
            shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          )}
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-[color:var(--accent)]" />
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          </div>

          {children}
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function Page() {
  /* ---------------------------- Profile constants ---------------------------- */

  const NAME = "Sukhmanpreet Kaur";
  const EMAIL = "k.sukhmanpreet@outlook.com";

  const GITHUB = "https://github.com/sukhmanprit";
  const LINKEDIN = "https://www.linkedin.com/in/sukhmanprit-kaur/";
  const MINI_PROJECTS_FALLBACK_URL = GITHUB;

  // Hero image must exist in /public (example: /public/hero.png)
  const HERO_IMAGE_SRC = "/hero.png";

  /* ----------------------------- Theme management ---------------------------- */

  /**
   * Theme is applied by setting a data attribute on <html>.
   * globals.css uses :root and :root[data-theme="dark"] to switch tokens.
   */
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /* ------------------------------- Scroll spy -------------------------------- */

  /**
   * Tracks which section is currently in view.
   * Used to style the active navigation link at the top.
   */
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const ids = ["about", "skills", "projects", "experience", "contact"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0.08, 0.15, 0.25] }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                               Page content data                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Main projects shown in the 2-column grid.
   * Keep summaries short and outcome/result as a single scannable line.
   */
  const projects: Project[] = useMemo(
    () => [
      {
        title: "Babysitter Connect",
        category: "Full-stack",
        featured: true,
        summary:
          "MERN platform for finding trusted babysitters with role-based access and admin approval. Built around safety, verification, and a clean user flow.",
        result: "Role-based access and admin workflow implemented end-to-end.",
        tech: ["React", "Node.js", "MongoDB", "JWT", "Firebase", "SendGrid", "Vercel"],
        href: "https://github.com/sukhmanprit/babysitter-connect",
      },
      {
        title: "Fragments Microservice",
        category: "Cloud",
        featured: true,
        summary:
          "Microservice to store and retrieve text, JSON, and image fragments with authenticated access, metadata tracking, and format conversion support.",
        result: "Containerized service with AWS storage and auth integration.",
        tech: ["Node.js", "Docker", "AWS", "Cognito", "DynamoDB", "S3", "ECS", "CI/CD"],
        href: "https://github.com/sukhmanprit/fragments",
      },
      {
        title: "Self-Driving Car Simulation",
        category: "ML",
        summary:
          "CNN model that predicts steering angle from camera images in a simulator. Includes preprocessing, augmentation, training, and evaluation.",
        result: "Built preprocessing and augmentation pipeline for training runs.",
        tech: ["Python", "TensorFlow", "OpenCV", "CNN", "Data Augmentation"],
        href: "https://github.com/sukhmanprit/self-driving-car-simulation",
      },
      {
        title: "Decision Making Tool",
        category: "Analytics",
        summary:
          "Decision-support approach using weighted criteria and risk-impact thinking to compare options and document tradeoffs clearly.",
        result: "Structured comparisons using weighted scoring and risk notes.",
        tech: ["Decision Matrix", "Weighted Scoring", "Risk Analysis"],
        href: "https://github.com/sukhmanprit/decision-making-tool",
      },
    ],
    []
  );

  /**
   * Smaller projects, grouped under Applied ML and Computer Vision.
   * These intentionally link to a fallback URL unless each one has its own repo.
   */
  const miniProjects: GroupedProject[] = useMemo(
    () => [
      {
        title: "Mini Photo Editor",
        summary:
          "OpenCV-based tool for common image operations like filters, transforms, and visualization to strengthen practical CV fundamentals.",
        result: "Implemented core filters and transform utilities for practice.",
        tech: ["Python", "OpenCV", "NumPy", "Matplotlib"],
        href: MINI_PROJECTS_FALLBACK_URL,
      },
      {
        title: "House Price Estimator",
        summary:
          "Multiple linear regression experiment using LinearRegression and SGDRegressor. Evaluated with MAE, MSE, RMSE, and MAPE.",
        result: "Compared regressors and documented metric tradeoffs.",
        tech: ["Regression", "SGDRegressor", "Metrics"],
        href: MINI_PROJECTS_FALLBACK_URL,
      },
      {
        title: "Dog vs Cat Classifier",
        summary:
          "Small classification experiment focusing on preprocessing, feature extraction, and baseline modeling decisions.",
        result: "Baseline model and preprocessing notes for iteration.",
        tech: ["Classification", "Preprocessing", "ML Basics"],
        href: MINI_PROJECTS_FALLBACK_URL,
      },
    ],
    [MINI_PROJECTS_FALLBACK_URL]
  );

  /**
   * Skills are shown as names only (no paragraphs).
   * This keeps the page clean while still covering multiple target roles.
   */
  const skillGroups: SkillGroup[] = useMemo(
    () => [
      { title: "Data and Analytics", skills: ["Python", "SQL", "Excel", "Power BI", "Pandas", "NumPy"] },
      {
        title: "Machine Learning and Computer Vision",
        skills: ["scikit-learn", "TensorFlow", "OpenCV", "CNN", "Feature Extraction", "Neural Nets"],
      },
      { title: "Programming and Systems", skills: ["JavaScript", "C++", "DSA", "REST APIs", "Git/GitHub"] },
      { title: "Cloud and DevOps", skills: ["AWS", "Docker", "CI/CD", "ECS", "S3", "DynamoDB"] },
      { title: "Enterprise IT and Governance", skills: ["Microsoft 365", "Active Directory", "Intune", "ITSM", "ISO 27001", "BCP"] },
      { title: "UX and Human-Centered Design", skills: ["Figma", "Adobe XD", "HCI", "Accessibility", "Prototyping"] },
    ],
    []
  );

  /**
   * Experience entries use an "outline" card to look more like a clean resume section.
   * Each item is structured as: org + role/meta/when on the left, bullets on the right.
   */
  const experiences: Experience[] = useMemo(
    () => [
      {
        org: "Ontario Public Service",
        role: "Tier 2 End User IT Support",
        meta: "M365 | Windows 11 | ITSM",
        when: "2024 (4 months)",
        points: [
          "Tier 2 onsite and remote support for endpoints, identity, and Microsoft 365.",
          "Supported Windows 11 rollout work including device readiness and validation.",
          "Worked in structured ITSM workflows with consistent documentation.",
        ],
      },
      {
        org: "Martinrea",
        role: "IT Admin and Risk/Compliance Intern",
        meta: "Entra ID | Intune | ISO 27001",
        when: "2023 (4 months)",
        points: [
          "Supported enterprise systems across AD, Entra ID, Intune, and Microsoft 365.",
          "Assisted audit readiness and remediation tracking (ISO 27001 aligned work).",
          "Helped with vulnerability remediation workflows and governance documentation.",
        ],
      },
      {
        org: "Revera",
        role: "Technical Support Analyst",
        meta: "Remote support | SOP/KB | Access admin",
        when: "2022–2023",
        points: [
          "Tier 1/2 remote support across many sites in a healthcare environment.",
          "Account and access administration with consistent documentation.",
          "Created SOPs and KB articles to reduce repeated issues.",
        ],
      },
    ],
    []
  );

  /* -------------------------------------------------------------------------- */
  /*                             Small UI helpers                               */
  /* -------------------------------------------------------------------------- */

  /**
   * NavLink
   * Highlights the link matching the currently visible section (activeId).
   */
  function NavLink({ href, label, id }: { href: string; label: string; id: string }) {
    const isActive = activeId === id;

    return (
      <a
        href={href}
        className={cx(
          "px-2 py-1 text-sm transition-colors",
          isActive
            ? "font-medium text-[color:var(--accent)] underline underline-offset-8 decoration-[color:var(--accent)]"
            : "text-foreground/75 hover:text-[color:var(--accent)] hover:underline hover:underline-offset-8"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </a>
    );
  }

  /**
   * TechTags
   * Renders a list of neutral tech tags under a project card.
   */
  function TechTags({ tech }: { tech: string[] }) {
    return (
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {tech.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    );
  }

  /**
   * MetaLabel
   * Small, consistent label style used for project category labels.
   */
  function MetaLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-xs uppercase tracking-wide text-foreground/60">{children}</p>;
  }

  /**
   * ProjectCard
   * Card layout for the main projects grid.
   * Keeps content in a consistent order for scanning:
   * category -> title -> summary -> result -> tech tags
   */
  function ProjectCard({ p }: { p: Project }) {
    return (
      <Card className="relative flex h-full flex-col overflow-hidden" variant={p.featured ? "featured" : "default"}>
        <div className="pointer-events-none absolute -right-28 -top-28 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,var(--accent-soft),transparent_60%)] blur-3xl" />

        <MetaLabel>{p.category}</MetaLabel>

        <a
          href={p.href}
          target="_blank"
          rel="noreferrer"
          className={cx(
            "mt-2 inline-flex items-center gap-2",
            "text-base sm:text-lg font-semibold tracking-tight",
            "text-foreground transition-colors hover:text-[color:var(--accent)]"
          )}
        >
          {p.title}
          <span className="text-xs text-foreground/50">↗</span>
        </a>

        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{p.summary}</p>

        {p.result ? (
          <p className="mt-3 text-xs text-foreground/70">
            <span className="font-semibold text-foreground/80">Result:</span> {p.result}
          </p>
        ) : null}

        <TechTags tech={p.tech} />
      </Card>
    );
  }

  /**
   * MiniCard
   * A smaller project card used for the "Applied ML and Computer Vision" grid.
   * Uses the same visual language as ProjectCard so the section feels cohesive.
   */
  function MiniCard({ m }: { m: GroupedProject }) {
    return (
      <Card className="relative flex h-full flex-col" variant="default">
        <MetaLabel>ML</MetaLabel>

        <a
          href={m.href ?? MINI_PROJECTS_FALLBACK_URL}
          target="_blank"
          rel="noreferrer"
          className={cx(
            "mt-2 inline-flex items-center gap-2",
            "text-base font-semibold tracking-tight",
            "text-foreground transition-colors hover:text-[color:var(--accent)]"
          )}
        >
          {m.title}
          <span className="text-xs text-foreground/50">↗</span>
        </a>

        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{m.summary}</p>

        {m.result ? (
          <p className="mt-3 text-xs text-foreground/70">
            <span className="font-semibold text-foreground/80">Result:</span> {m.result}
          </p>
        ) : null}

        <TechTags tech={m.tech} />
      </Card>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Decorative background glows (purely visual, no interaction) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20%] top-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,var(--accent-soft),transparent_60%)] blur-3xl" />
        <div className="absolute right-[-15%] top-[18%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,var(--accent-alt-soft),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-25%] left-[18%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.06),transparent_60%)] blur-3xl" />
      </div>

      {/* Sticky nav with section links + external links + theme toggle */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur">
        <Container>
          <div className="flex h-14 items-center justify-between">
            <nav className="flex items-center gap-2">
              <NavLink href="#about" label="About" id="about" />
              <NavLink href="#skills" label="Skills" id="skills" />
              <NavLink href="#projects" label="Projects" id="projects" />
              <NavLink href="#experience" label="Experience" id="experience" />
              <NavLink href="#contact" label="Contact" id="contact" />
            </nav>

            <div className="flex items-center gap-3">
              <a
                className="px-2 py-1 text-sm text-foreground/75 transition-colors hover:text-[color:var(--accent)]"
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                className="px-2 py-1 text-sm text-foreground/75 transition-colors hover:text-[color:var(--accent)]"
                href={LINKEDIN}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl border border-border bg-card px-3 py-1 text-sm text-foreground/85 transition-colors hover:bg-[color:var(--accent-soft-2)]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </Container>
      </div>

      {/* Hero section: name, headline, short summary, and image */}
      <section className="relative overflow-hidden border-b border-border">
        <Container>
          <div className="grid items-center gap-10 py-12 sm:py-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{NAME}</h1>

              <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--accent)] sm:text-2xl">
                Technology Analyst with Data and ML foundations
              </p>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/85 sm:text-lg">
                Software Development graduate with strong foundations in programming, data analysis,
                and systems thinking, combined with real-world enterprise experience in support,
                governance, and structured environments.
              </p>
            </div>

            <div className="lg:col-span-5">
              <Card className="p-4" variant="featured">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
                  <Image
                    src={HERO_IMAGE_SRC}
                    alt="Hero"
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 dark:from-white/5 dark:to-black/10" />
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* About section: three small cards with short statements */}
      <Section id="about" title="About" band>
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="soft">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">What I bring</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">
              Strong foundations in programming, analytics, and systems thinking, plus real
              enterprise experience supporting users, tools, and structured workflows.
            </p>
          </Card>

          <Card variant="soft">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">What I’m building toward</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">
              Data Analyst and Business Analyst roles, expanding deeper into ML projects and
              decision-focused analytics.
            </p>
          </Card>

          <Card variant="soft">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">How I work</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">
              Clear communication, clean documentation, disciplined execution, and fast learning
              when moving into new tools or environments.
            </p>
          </Card>
        </div>
      </Section>

      {/* Skills section: name-only skills grouped by theme for fast scanning */}
      <Section id="skills" title="Skills">
        <div className="grid gap-6 md:grid-cols-2">
          {skillGroups.map((g) => (
            <Card key={g.title} variant="default" className="p-6">
              <h3 className="text-base sm:text-lg font-semibold tracking-tight">{g.title}</h3>
              <SkillsGrid items={g.skills} />
            </Card>
          ))}
        </div>
      </Section>

      {/* Projects section: featured projects + mini projects grouped by theme */}
      <Section id="projects" title="Projects" band>
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.title} p={p} />
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-base sm:text-lg font-semibold tracking-tight">Applied ML and Computer Vision</h3>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {miniProjects.map((m) => (
              <MiniCard key={m.title} m={m} />
            ))}
          </div>
        </div>
      </Section>

      {/* Experience section: resume-like layout with role details and bullets */}
      <Section id="experience" title="Experience">
        <div className="space-y-6">
          {experiences.map((e) => (
            <Card key={e.role} variant="outline" className="p-0">
              <div className="grid md:grid-cols-12">
                <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[color:var(--border)] p-7">
                  <p className="text-sm font-semibold">{e.org}</p>
                  <p className="mt-1 text-sm text-foreground/85">{e.role}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-foreground/60">{e.meta}</p>
                  <p className="mt-2 text-xs text-foreground/70">{e.when}</p>
                </div>

                <div className="md:col-span-8 p-7">
                  <ul className="mt-0 space-y-2 text-sm text-foreground/85">
                    {e.points.map((t) => (
                      <li key={t} className="flex gap-2">
                        <span className="mt-[2px] text-[color:var(--accent-alt)]">•</span>
                        <span className="leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Contact section: simple cards with links */}
      <Section id="contact" title="Contact" band>
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="soft">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Email</h3>
            <p className="mt-3 text-sm text-foreground/85">
              <a className="transition-colors hover:text-[color:var(--accent)]" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </p>
          </Card>

          <Card variant="soft">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">GitHub</h3>
            <p className="mt-3 text-sm text-foreground/85">
              <a className="transition-colors hover:text-[color:var(--accent)]" href={GITHUB} target="_blank" rel="noreferrer">
                {GITHUB}
              </a>
            </p>
          </Card>

          <Card variant="soft">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">LinkedIn</h3>
            <p className="mt-3 text-sm text-foreground/85">
              <a className="transition-colors hover:text-[color:var(--accent)]" href={LINKEDIN} target="_blank" rel="noreferrer">
                {LINKEDIN}
              </a>
            </p>
          </Card>
        </div>
      </Section>

      {/* Footer: minimal and consistent with the banded sections */}
      <footer className="border-t border-border py-10 bg-[color:var(--muted)]">
        <Container>
          <p className="text-center text-sm text-foreground/70">
            © {new Date().getFullYear()} {NAME}
          </p>
        </Container>
      </footer>
    </div>
  );
}
