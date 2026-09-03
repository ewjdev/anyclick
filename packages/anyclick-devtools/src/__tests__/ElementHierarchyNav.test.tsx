import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAnyclickOwnedUI,
  isBlacklisted,
  isStructuralElement,
} from "../InspectDialog/ElementHierarchyNav";

describe("ElementHierarchyNav utilities", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("isStructuralElement", () => {
    it("returns true for <br> elements", () => {
      const br = document.createElement("br");
      container.appendChild(br);
      expect(isStructuralElement(br)).toBe(true);
    });

    it("returns true for SVG elements", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      container.appendChild(svg);
      expect(isStructuralElement(svg)).toBe(true);

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      svg.appendChild(path);
      expect(isStructuralElement(path)).toBe(true);

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      svg.appendChild(circle);
      expect(isStructuralElement(circle)).toBe(true);
    });

    it("returns true for script/style/template elements", () => {
      const script = document.createElement("script");
      const style = document.createElement("style");
      const template = document.createElement("template");

      expect(isStructuralElement(script)).toBe(true);
      expect(isStructuralElement(style)).toBe(true);
      expect(isStructuralElement(template)).toBe(true);
    });

    it("returns false for normal HTML elements", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      const button = document.createElement("button");
      const p = document.createElement("p");
      const h1 = document.createElement("h1");

      expect(isStructuralElement(div)).toBe(false);
      expect(isStructuralElement(span)).toBe(false);
      expect(isStructuralElement(button)).toBe(false);
      expect(isStructuralElement(p)).toBe(false);
      expect(isStructuralElement(h1)).toBe(false);
    });
  });

  describe("isAnyclickOwnedUI", () => {
    it("returns true for elements with data-anyclick-inspector", () => {
      const div = document.createElement("div");
      div.setAttribute("data-anyclick-inspector", "");
      container.appendChild(div);
      expect(isAnyclickOwnedUI(div)).toBe(true);
    });

    it("returns true for elements with data-anyclick-menu", () => {
      const div = document.createElement("div");
      div.setAttribute("data-anyclick-menu", "");
      container.appendChild(div);
      expect(isAnyclickOwnedUI(div)).toBe(true);
    });

    it("returns true for elements with data-anyclick-pointer", () => {
      const div = document.createElement("div");
      div.setAttribute("data-anyclick-pointer", "");
      container.appendChild(div);
      expect(isAnyclickOwnedUI(div)).toBe(true);
    });

    it("returns true for elements with data-anyclick-toast", () => {
      const div = document.createElement("div");
      div.setAttribute("data-anyclick-toast", "");
      container.appendChild(div);
      expect(isAnyclickOwnedUI(div)).toBe(true);
    });

    it("returns true for elements with data-anyclick-overlay", () => {
      const div = document.createElement("div");
      div.setAttribute("data-anyclick-overlay", "");
      container.appendChild(div);
      expect(isAnyclickOwnedUI(div)).toBe(true);
    });

    it("returns true for descendants of Anyclick-owned UI", () => {
      const inspector = document.createElement("div");
      inspector.setAttribute("data-anyclick-inspector", "");
      const child = document.createElement("span");
      const grandchild = document.createElement("button");

      inspector.appendChild(child);
      child.appendChild(grandchild);
      container.appendChild(inspector);

      expect(isAnyclickOwnedUI(child)).toBe(true);
      expect(isAnyclickOwnedUI(grandchild)).toBe(true);
    });

    it("returns false for normal elements without Anyclick markers", () => {
      const div = document.createElement("div");
      div.className = "my-component";
      container.appendChild(div);
      expect(isAnyclickOwnedUI(div)).toBe(false);
    });

    it("does NOT classify highlight classes as Anyclick-owned UI", () => {
      const target = document.createElement("div");
      target.classList.add("anyclick-highlight-target");
      container.appendChild(target);
      expect(isAnyclickOwnedUI(target)).toBe(false);

      const containerEl = document.createElement("div");
      containerEl.classList.add("anyclick-highlight-container");
      container.appendChild(containerEl);
      expect(isAnyclickOwnedUI(containerEl)).toBe(false);
    });

    it("does NOT exclude elements inside data-anyclick-root", () => {
      const root = document.createElement("div");
      root.setAttribute("data-anyclick-root", "");
      const appContent = document.createElement("main");
      appContent.className = "app-content";
      const button = document.createElement("button");
      button.textContent = "Click me";

      root.appendChild(appContent);
      appContent.appendChild(button);
      container.appendChild(root);

      expect(isAnyclickOwnedUI(appContent)).toBe(false);
      expect(isAnyclickOwnedUI(button)).toBe(false);
    });
  });

  describe("isBlacklisted", () => {
    it("returns true for structural elements", () => {
      const br = document.createElement("br");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

      expect(isBlacklisted(br)).toBe(true);
      expect(isBlacklisted(svg)).toBe(true);
    });

    it("returns true for Anyclick-owned UI", () => {
      const inspector = document.createElement("div");
      inspector.setAttribute("data-anyclick-inspector", "");
      container.appendChild(inspector);

      expect(isBlacklisted(inspector)).toBe(true);
    });

    it("returns false for normal elements", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");

      expect(isBlacklisted(div)).toBe(false);
      expect(isBlacklisted(span)).toBe(false);
    });

    it("returns false for elements with highlight classes (regression test for #96)", () => {
      const highlightedTarget = document.createElement("div");
      highlightedTarget.classList.add("anyclick-highlight-target");
      highlightedTarget.classList.add("my-heading");
      container.appendChild(highlightedTarget);

      expect(isBlacklisted(highlightedTarget)).toBe(false);

      const highlightedContainer = document.createElement("section");
      highlightedContainer.classList.add("anyclick-highlight-container");
      container.appendChild(highlightedContainer);

      expect(isBlacklisted(highlightedContainer)).toBe(false);
    });

    it("returns false for normal content inside data-anyclick-root", () => {
      const root = document.createElement("div");
      root.setAttribute("data-anyclick-root", "");
      const heading = document.createElement("h1");
      heading.textContent = "Hello World";
      root.appendChild(heading);
      container.appendChild(root);

      expect(isBlacklisted(heading)).toBe(false);
    });
  });

  describe("combined scenarios", () => {
    it("correctly handles a highlighted <span> inside content area", () => {
      const root = document.createElement("div");
      root.setAttribute("data-anyclick-root", "");

      const heading = document.createElement("span");
      heading.textContent = "Homepage Title";
      heading.classList.add("anyclick-highlight-target");

      root.appendChild(heading);
      container.appendChild(root);

      expect(isBlacklisted(heading)).toBe(false);
      expect(isStructuralElement(heading)).toBe(false);
      expect(isAnyclickOwnedUI(heading)).toBe(false);
    });

    it("correctly identifies <br> even when highlighted", () => {
      const br = document.createElement("br");
      br.classList.add("anyclick-highlight-target");
      container.appendChild(br);

      expect(isBlacklisted(br)).toBe(true);
      expect(isStructuralElement(br)).toBe(true);
    });

    it("correctly identifies inspector dialog elements", () => {
      const inspector = document.createElement("div");
      inspector.setAttribute("data-anyclick-inspector", "");
      inspector.innerHTML = `
        <div class="header">
          <button class="close">X</button>
        </div>
        <div class="content">
          <section class="properties"></section>
        </div>
      `;
      container.appendChild(inspector);

      const closeButton = inspector.querySelector(".close") as Element;
      const properties = inspector.querySelector(".properties") as Element;

      expect(isBlacklisted(closeButton)).toBe(true);
      expect(isBlacklisted(properties)).toBe(true);
      expect(isAnyclickOwnedUI(closeButton)).toBe(true);
      expect(isAnyclickOwnedUI(properties)).toBe(true);
    });
  });
});
