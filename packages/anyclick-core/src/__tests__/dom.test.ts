import { beforeEach, describe, expect, it } from "vitest";
import { getAncestors, getUniqueSelector } from "../dom";

describe("getUniqueSelector", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should return selector for element with id", () => {
    const div = document.createElement("div");
    div.id = "test-id";
    document.body.appendChild(div);

    expect(getUniqueSelector(div)).toBe("#test-id");
  });

  it("should return selector path for nested elements", () => {
    const outer = document.createElement("div");
    outer.className = "outer";
    const inner = document.createElement("span");
    inner.className = "inner";
    outer.appendChild(inner);
    document.body.appendChild(outer);

    const selector = getUniqueSelector(inner);
    expect(selector).toContain("span");
    expect(selector).toContain("div");
  });

  it("should stop at ownerDocument body, not global document.body", () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument!;
    const iframeBody = iframeDoc.body;

    const container = iframeDoc.createElement("div");
    container.className = "container";
    const target = iframeDoc.createElement("span");
    target.className = "target";
    container.appendChild(target);
    iframeBody.appendChild(container);

    const selector = getUniqueSelector(target);

    expect(selector).not.toContain("iframe");
    expect(selector).not.toContain("html > body");
    expect(selector).toContain("span");
    expect(target.ownerDocument).toBe(iframeDoc);
  });

  it("should use element's ownerDocument for selector generation", () => {
    const altDoc = document.implementation.createHTMLDocument("alt");
    const div = altDoc.createElement("div");
    div.className = "test-div";
    const span = altDoc.createElement("span");
    span.className = "test-span";
    div.appendChild(span);
    altDoc.body.appendChild(div);

    const selector = getUniqueSelector(span);

    expect(span.ownerDocument).toBe(altDoc);
    expect(selector).toBe("div.test-div > span.test-span");
  });
});

describe("getAncestors", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should return ancestors up to body", () => {
    const grandparent = document.createElement("div");
    grandparent.className = "grandparent";
    const parent = document.createElement("div");
    parent.className = "parent";
    const child = document.createElement("span");
    child.className = "child";

    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);

    const ancestors = getAncestors(child);

    expect(ancestors.length).toBe(2);
    expect(ancestors[0].classes).toContain("parent");
    expect(ancestors[1].classes).toContain("grandparent");
  });

  it("should respect maxDepth", () => {
    const grandparent = document.createElement("div");
    const parent = document.createElement("div");
    const child = document.createElement("span");

    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);

    const ancestors = getAncestors(child, 1);

    expect(ancestors.length).toBe(1);
  });

  it("should stop at ownerDocument body for iframe elements", () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument!;
    const iframeBody = iframeDoc.body;

    const container = iframeDoc.createElement("div");
    container.className = "container";
    const target = iframeDoc.createElement("span");
    target.className = "target";
    container.appendChild(target);
    iframeBody.appendChild(container);

    const ancestors = getAncestors(target);

    expect(ancestors.length).toBe(1);
    expect(ancestors[0].classes).toContain("container");
    expect(ancestors.some((a) => a.tag === "body")).toBe(false);
    expect(ancestors.some((a) => a.tag === "iframe")).toBe(false);
  });

  it("should use element's ownerDocument for alternate documents", () => {
    const altDoc = document.implementation.createHTMLDocument("alt");
    const outer = altDoc.createElement("div");
    outer.className = "outer";
    const inner = altDoc.createElement("span");
    inner.className = "inner";
    outer.appendChild(inner);
    altDoc.body.appendChild(outer);

    const ancestors = getAncestors(inner);

    expect(inner.ownerDocument).toBe(altDoc);
    expect(ancestors.length).toBe(1);
    expect(ancestors[0].classes).toContain("outer");
  });
});
