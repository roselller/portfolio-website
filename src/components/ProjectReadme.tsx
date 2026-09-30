import { createElement, Fragment, type ReactNode } from "react";
import { HTMLElement, NodeType, parse, type Node } from "node-html-parser";

const allowedTags = new Set([
  "a",
  "p",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "del",
  "s",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "br",
  "hr",
  "img",
  "details",
  "summary",
  "kbd",
  "sup",
  "sub",
  "dl",
  "dt",
  "dd",
  "input",
]);
const blockedTags = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "form",
  "template",
  "noscript",
  "button",
]);
const tableContainers = new Set(["table", "thead", "tbody", "tfoot", "tr"]);

function anchorId(value: string) {
  return `readme-${value.replace(/^user-content-/, "")}`;
}

function contentUrl(
  value: string | undefined,
  repositoryUrl: string,
  image = false,
) {
  if (!value) return undefined;
  try {
    if (!image && value.startsWith("#")) {
      return `#${anchorId(decodeURIComponent(value.slice(1)))}`;
    }
    const url = new URL(
      value,
      `${repositoryUrl}/${image ? "raw" : "blob"}/HEAD/`,
    );
    const allowed =
      url.protocol === "https:" ||
      url.protocol === "http:" ||
      (!image && url.protocol === "mailto:");
    return allowed && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Rebuild only document elements as React nodes; never inject remote HTML. */
export function ProjectReadme({
  html,
  repositoryUrl,
}: {
  html: string;
  repositoryUrl: string;
}) {
  function render(node: Node, key: number): ReactNode {
    if (node.nodeType === NodeType.TEXT_NODE) return node.text;
    if (!(node instanceof HTMLElement)) return null;
    const tag = node.rawTagName.toLowerCase();
    if (blockedTags.has(tag)) return null;
    // React rejects formatting whitespace between table rows and cells.
    const children = node.childNodes
      .filter(
        (child) =>
          !(
            tableContainers.has(tag) &&
            child.nodeType === NodeType.TEXT_NODE &&
            !child.text.trim()
          ),
      )
      .map(render);
    if (!allowedTags.has(tag))
      return createElement(Fragment, { key }, ...children);
    const props: Record<string, unknown> = { key };
    const id =
      node.getAttribute("id") ||
      node.getAttribute("name") ||
      node.querySelector(":scope > a.anchor[id]")?.getAttribute("id");
    if (id) props.id = anchorId(id);

    if (tag === "a") {
      // GitHub's empty permalink icons have no content after SVG removal.
      if (!node.text.trim() && !node.querySelector("img")) return null;
      const href = contentUrl(node.getAttribute("href"), repositoryUrl);
      if (!href) return createElement(Fragment, { key }, ...children);
      props.href = href;
      if (!href.startsWith("#")) {
        props.target = "_blank";
        props.rel = "noopener noreferrer";
      }
    }
    if (tag === "img") {
      const src = contentUrl(node.getAttribute("src"), repositoryUrl, true);
      return src
        ? createElement("img", {
            ...props,
            src,
            alt: node.getAttribute("alt") || "",
            loading: "lazy",
            decoding: "async",
          })
        : null;
    }
    if (tag === "input") {
      return node.getAttribute("type") === "checkbox"
        ? createElement("input", {
            key,
            type: "checkbox",
            disabled: true,
            readOnly: true,
            checked: node.hasAttribute("checked"),
          })
        : null;
    }
    if (tag === "ol" && /^-?\d+$/.test(node.getAttribute("start") || "")) {
      props.start = Number(node.getAttribute("start"));
    }
    if (tag === "details") props.open = node.hasAttribute("open");
    // The page title and Project brief own heading levels one and two.
    const outputTag = /^h[1-6]$/.test(tag)
      ? `h${Math.min(6, Number(tag[1]) + 2)}`
      : tag;
    const element = createElement(outputTag, props, ...children);
    return tag === "table"
      ? createElement(
          "div",
          {
            key,
            className: "readme-table",
            tabIndex: 0,
            role: "region",
            "aria-label": "README table",
          },
          element,
        )
      : element;
  }
  return createElement(
    "div",
    { className: "project-readme" },
    ...parse(html, {
      blockTextElements: { script: true, noscript: true, style: true },
    }).childNodes.map(render),
  );
}
