"use client";

import { useEffect } from "react";
import { ExternalLink, Github, Linkedin } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TriangleGraphic } from "@/components/triangle-graphic";

const works = [
  {
    name: "OpenBGRemover.dev",
    description: "AI image-removal API platform",
    tech: [""],
    link: "openbgremover.dev",
  },
  {
    name: "Edutrack",
    description: "Analytics tool for Professors to help gauge student performance",
    tech: [""],
    link: "https://edutrack.streamlit.app/",
  },
  {
    name: "Himmel Website",
    description: "Himmel.at Website",
    tech: [""],
    link: "himmel.at",
  },
//  {
//    name: "",
//    description: "",
//    tech: [""],
//    link: "",
//    isWork: true,
//  },
//  {
//    name: "",
//    description: "",
//    tech: [""],
//    link: "",
//    isWork: true,
//  },
//  {
//    name: "",
//    description: "",
//    tech: [""],
//    link: "",
//    isWork: true,
//  },
];

function buildPersonalLink(link: string) {
  if (!link) return "#";
  const trimmed = link.trim();
  if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;
  return `https://${trimmed}`;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed top-0 right-0">
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24 leading-7">
        <header className="mb-12 flex flex-col items-center text-center space-y-3 max-w-xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif lg:text-5xl tracking-[0.18em] leading-tight font-bold md:whitespace-nowrap">
            KALOYAN GANTCHEV
          </h1>

          <p className="text-sm italic font-medium text-muted-foreground tracking-wider">
            {"kaloyangantchev@gmail.com"}
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <a
              href="https://github.com/superuserkalo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground transition-colors hover:text-muted-foreground"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 ml-[3px]" />
            </a>
            <a
              href="https://www.linkedin.com/in/kaloyan-gantchev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground transition-colors hover:text-muted-foreground"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="/Lebenslauf_Kaloyan_Gantchev.pdf" className="inline-flex items-center gap-1.5 border-foreground px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background text-sm tracking-normal border-2 border-double rounded-xs"
            target="_blank"
            rel="noopener noreferrer"
            >
              CV (German)
            </a>
          </div>
        </header>

        <section className="mb-16 flex justify-center">
          <TriangleGraphic />
        </section>

        <section className="ml-0 leading-6">
          <h2 className="text-center text-sm tracking-widest text-muted-foreground mb-8 mt-[-35px]">
            -- Projects / Work --
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-[-20px]">
            {works.map((work) => (
              <a
                key={work.name}
                href={buildPersonalLink(work.link)}
                className="group flex h-full flex-col justify-between rounded-xs border border-border/60 bg-muted/10 p-4"
                target="_blank"
                rel="noreferrer noopener"
              >
                <div className="flex items-start justify-between gap-2 leading-7">
                  <span className="font-medium">{work.name}</span>
                  <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{work.description}</p>
                {work.tech && work.tech.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {work.tech.map((t) => (
                      <span key={t} className="text-xs text-muted-foreground/70">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
