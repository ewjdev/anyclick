import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import ElementHierarchyNav, {
  isAnyclickOwnedUI,
  isBlacklisted,
  isStructuralElement,
  isEligibleForNavigation,
  findEligibleParent,
  findEligiblePrevSibling,
  findEligibleNextSibling,
  findEligibleFirstChild,
  findOmittedAncestors,
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
        "path"
      );
      svg.appendChild(path);
      expect(isStructuralElement(path)).toBe(true);

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
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

    it("returns true for elements with data-anyclick-ui (ContextMenu/QuickChat marker)", () => {
      const menu = document.createElement("div");
      menu.setAttribute("data-anyclick-ui", "");
      menu.setAttribute("role", "menu");
      container.appendChild(menu);
      expect(isAnyclickOwnedUI(menu)).toBe(true);
    });

    it("returns true for descendants of data-anyclick-ui (visible menu regression)", () => {
      const menuRoot = document.createElement("div");
      menuRoot.setAttribute("data-anyclick-ui", "");
      menuRoot.setAttribute("aria-label", "Feedback options");
      menuRoot.setAttribute("role", "menu");

      const menuItem = document.createElement("button");
      menuItem.setAttribute("role", "menuitem");
      menuItem.textContent = "Submit Feedback";

      menuRoot.appendChild(menuItem);
      container.appendChild(menuRoot);

      expect(isAnyclickOwnedUI(menuRoot)).toBe(true);
      expect(isAnyclickOwnedUI(menuItem)).toBe(true);
      expect(isBlacklisted(menuRoot)).toBe(true);
      expect(isBlacklisted(menuItem)).toBe(true);
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

describe("Navigation helper functions", () => {
  let container: HTMLDivElement;

  function createElementWithSize(
    tag: string,
    options: { id?: string; classes?: string[] } = {}
  ) {
    const el = document.createElement(tag);
    if (options.id) el.id = options.id;
    if (options.classes) el.classList.add(...options.classes);
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        right: 100,
        bottom: 50,
      }),
    });
    return el;
  }

  function createZeroSizeElement(tag: string) {
    const el = document.createElement(tag);
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }),
    });
    return el;
  }

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({
        width: 500,
        height: 500,
        top: 0,
        left: 0,
        right: 500,
        bottom: 500,
      }),
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("isEligibleForNavigation", () => {
    it("returns true for normal visible elements", () => {
      const div = createElementWithSize("div");
      container.appendChild(div);
      expect(isEligibleForNavigation(div)).toBe(true);
    });

    it("returns false for zero-size elements", () => {
      const div = createZeroSizeElement("div");
      container.appendChild(div);
      expect(isEligibleForNavigation(div)).toBe(false);
    });

    it("returns false for blacklisted elements", () => {
      const br = createElementWithSize("br");
      container.appendChild(br);
      expect(isEligibleForNavigation(br)).toBe(false);
    });

    it("returns false for Anyclick-owned UI", () => {
      const inspector = createElementWithSize("div");
      inspector.setAttribute("data-anyclick-inspector", "");
      container.appendChild(inspector);
      expect(isEligibleForNavigation(inspector)).toBe(false);
    });
  });

  describe("findEligibleParent", () => {
    it("finds the nearest eligible parent", () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const child = createElementWithSize("div", { id: "child" });
      parent.appendChild(child);
      container.appendChild(parent);

      expect(findEligibleParent(child)).toBe(parent);
    });

    it("skips zero-size parent elements", () => {
      const grandparent = createElementWithSize("main", { id: "grandparent" });
      const parent = createZeroSizeElement("div");
      const child = createElementWithSize("span", { id: "child" });
      grandparent.appendChild(parent);
      parent.appendChild(child);
      container.appendChild(grandparent);

      expect(findEligibleParent(child)).toBe(grandparent);
    });

    it("skips blacklisted parent elements", () => {
      const grandparent = createElementWithSize("main", { id: "grandparent" });
      const parent = createElementWithSize("div");
      parent.setAttribute("data-anyclick-ui", "");
      const child = createElementWithSize("span", { id: "child" });
      grandparent.appendChild(parent);
      parent.appendChild(child);
      container.appendChild(grandparent);

      expect(findEligibleParent(child)).toBe(grandparent);
    });

    it("returns the container when it is the nearest eligible parent", () => {
      const child = createElementWithSize("div", { id: "child" });
      container.appendChild(child);

      expect(findEligibleParent(child)).toBe(container);
    });

    it("returns null when every ancestor is ineligible", () => {
      const provider = createElementWithSize("div");
      provider.setAttribute("data-anyclick-provider", "");
      const grandparent = createElementWithSize("div");
      grandparent.setAttribute("data-anyclick-ui", "");
      const parent = createZeroSizeElement("div");
      const child = createElementWithSize("span", { id: "child" });

      provider.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(child);
      container.appendChild(provider);

      expect(findEligibleParent(child)).toBe(null);
    });

    it("stops at provider boundary", () => {
      const provider = createElementWithSize("div");
      provider.setAttribute("data-anyclick-provider", "");
      const child = createElementWithSize("div", { id: "child" });
      provider.appendChild(child);
      container.appendChild(provider);

      expect(findEligibleParent(child)).toBe(null);
    });
  });

  describe("findEligiblePrevSibling", () => {
    it("finds the nearest previous eligible sibling", () => {
      const prev = createElementWithSize("div", { id: "prev" });
      const current = createElementWithSize("div", { id: "current" });
      container.appendChild(prev);
      container.appendChild(current);

      expect(findEligiblePrevSibling(current)).toBe(prev);
    });

    it("skips zero-size siblings", () => {
      const prev1 = createElementWithSize("div", { id: "prev1" });
      const zeroSize = createZeroSizeElement("div");
      const current = createElementWithSize("div", { id: "current" });
      container.appendChild(prev1);
      container.appendChild(zeroSize);
      container.appendChild(current);

      expect(findEligiblePrevSibling(current)).toBe(prev1);
    });

    it("skips blacklisted siblings", () => {
      const prev1 = createElementWithSize("div", { id: "prev1" });
      const br = createElementWithSize("br");
      const current = createElementWithSize("div", { id: "current" });
      container.appendChild(prev1);
      container.appendChild(br);
      container.appendChild(current);

      expect(findEligiblePrevSibling(current)).toBe(prev1);
    });

    it("returns null when no previous sibling exists", () => {
      const current = createElementWithSize("div", { id: "current" });
      container.appendChild(current);

      expect(findEligiblePrevSibling(current)).toBe(null);
    });
  });

  describe("findEligibleNextSibling", () => {
    it("finds the nearest next eligible sibling", () => {
      const current = createElementWithSize("div", { id: "current" });
      const next = createElementWithSize("div", { id: "next" });
      container.appendChild(current);
      container.appendChild(next);

      expect(findEligibleNextSibling(current)).toBe(next);
    });

    it("skips zero-size siblings", () => {
      const current = createElementWithSize("div", { id: "current" });
      const zeroSize = createZeroSizeElement("div");
      const next = createElementWithSize("div", { id: "next" });
      container.appendChild(current);
      container.appendChild(zeroSize);
      container.appendChild(next);

      expect(findEligibleNextSibling(current)).toBe(next);
    });

    it("returns null when no next sibling exists", () => {
      const current = createElementWithSize("div", { id: "current" });
      container.appendChild(current);

      expect(findEligibleNextSibling(current)).toBe(null);
    });
  });

  describe("findEligibleFirstChild", () => {
    it("finds the first eligible child", () => {
      const parent = createElementWithSize("div", { id: "parent" });
      const child1 = createElementWithSize("span", { id: "child1" });
      const child2 = createElementWithSize("span", { id: "child2" });
      parent.appendChild(child1);
      parent.appendChild(child2);
      container.appendChild(parent);

      expect(findEligibleFirstChild(parent)).toBe(child1);
    });

    it("skips zero-size children", () => {
      const parent = createElementWithSize("div", { id: "parent" });
      const zeroSize = createZeroSizeElement("div");
      const child = createElementWithSize("span", { id: "child" });
      parent.appendChild(zeroSize);
      parent.appendChild(child);
      container.appendChild(parent);

      expect(findEligibleFirstChild(parent)).toBe(child);
    });

    it("skips blacklisted children", () => {
      const parent = createElementWithSize("div", { id: "parent" });
      const br = createElementWithSize("br");
      const child = createElementWithSize("span", { id: "child" });
      parent.appendChild(br);
      parent.appendChild(child);
      container.appendChild(parent);

      expect(findEligibleFirstChild(parent)).toBe(child);
    });

    it("returns null when element has no children", () => {
      const parent = createElementWithSize("div", { id: "parent" });
      container.appendChild(parent);

      expect(findEligibleFirstChild(parent)).toBe(null);
    });

    it("returns null when all children are ineligible", () => {
      const parent = createElementWithSize("div", { id: "parent" });
      const blacklistedChild = createElementWithSize("br");
      const zeroSizeChild = createZeroSizeElement("span");

      parent.appendChild(blacklistedChild);
      parent.appendChild(zeroSizeChild);
      container.appendChild(parent);

      expect(findEligibleFirstChild(parent)).toBe(null);
    });
  });

  describe("findOmittedAncestors", () => {
    it("finds ancestors above the parent", () => {
      const greatGrandparent = createElementWithSize("main");
      const hiddenAncestor = createZeroSizeElement("div");
      const grandparent = createElementWithSize("section");
      const parent = createElementWithSize("article");
      const child = createElementWithSize("div");

      greatGrandparent.appendChild(hiddenAncestor);
      hiddenAncestor.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(child);
      container.appendChild(greatGrandparent);

      const ancestors = findOmittedAncestors(child, parent);
      expect(ancestors).toContain(grandparent);
      expect(ancestors).toContain(greatGrandparent);
      expect(ancestors).not.toContain(hiddenAncestor);
      expect(ancestors).not.toContain(parent);
    });

    it("returns ancestors above the given parent", () => {
      const parent = createElementWithSize("div");
      const child = createElementWithSize("span");
      parent.appendChild(child);
      container.appendChild(parent);

      const ancestors = findOmittedAncestors(child, parent);
      expect(ancestors.length).toBe(1);
      expect(ancestors[0]).toBe(container);
    });

    it("returns an empty array when no omitted ancestors exist", () => {
      const provider = createElementWithSize("div");
      provider.setAttribute("data-anyclick-provider", "");
      const hiddenAncestor = createZeroSizeElement("main");
      const parent = createElementWithSize("section");
      const child = createElementWithSize("div");

      provider.appendChild(hiddenAncestor);
      hiddenAncestor.appendChild(parent);
      parent.appendChild(child);
      container.appendChild(provider);

      expect(findOmittedAncestors(child, parent)).toEqual([]);
    });

    it("stops at provider boundary", () => {
      const provider = createElementWithSize("div");
      provider.setAttribute("data-anyclick-provider", "");
      const parent = createElementWithSize("section");
      const child = createElementWithSize("div");

      provider.appendChild(parent);
      parent.appendChild(child);
      container.appendChild(provider);

      const ancestors = findOmittedAncestors(child, parent);
      expect(ancestors).not.toContain(provider);
    });
  });
});

describe("ElementHierarchyNav component", () => {
  let container: HTMLDivElement;
  let onSelectElement: ReturnType<typeof vi.fn>;

  function createElementWithSize(
    tag: string,
    options: { id?: string; classes?: string[] } = {}
  ) {
    const el = document.createElement(tag);
    if (options.id) el.id = options.id;
    if (options.classes) el.classList.add(...options.classes);
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        right: 100,
        bottom: 50,
      }),
    });
    return el;
  }

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({
        width: 500,
        height: 500,
        top: 0,
        left: 0,
        right: 500,
        bottom: 500,
      }),
    });
    document.body.appendChild(container);
    onSelectElement = vi.fn();
  });

  afterEach(() => {
    container.remove();
  });

  describe("compact local window rendering", () => {
    it("renders all relationship entries when available", () => {
      const grandparent = createElementWithSize("main", { id: "grandparent" });
      const parent = createElementWithSize("section", { id: "parent" });
      const prevSibling = createElementWithSize("div", { id: "prev" });
      const target = createElementWithSize("article", { id: "target" });
      const nextSibling = createElementWithSize("div", { id: "next" });
      const child = createElementWithSize("span", { id: "child" });

      grandparent.appendChild(parent);
      parent.appendChild(prevSibling);
      parent.appendChild(target);
      parent.appendChild(nextSibling);
      target.appendChild(child);
      container.appendChild(grandparent);

      const { getByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "article",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      expect(getByText("parent")).toBeInTheDocument();
      expect(getByText("prev")).toBeInTheDocument();
      expect(getByText("next")).toBeInTheDocument();
      expect(getByText("child")).toBeInTheDocument();
    });

    it("shows child entry even when next sibling exists", () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const target = createElementWithSize("article", { id: "target" });
      const nextSibling = createElementWithSize("div", { id: "next" });
      const child = createElementWithSize("span", { id: "child" });

      parent.appendChild(target);
      parent.appendChild(nextSibling);
      target.appendChild(child);
      container.appendChild(parent);

      const { getByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "article",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      expect(getByText("next")).toBeInTheDocument();
      expect(getByText("child")).toBeInTheDocument();
    });

    it("does not show entries for missing relations", () => {
      const target = createElementWithSize("div", { id: "target" });
      container.appendChild(target);

      const { queryByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      expect(queryByText("prev")).not.toBeInTheDocument();
      expect(queryByText("next")).not.toBeInTheDocument();
      expect(queryByText("child")).not.toBeInTheDocument();
    });
  });

  describe("element selection", () => {
    it("calls onSelectElement when clicking a sibling", async () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const prevSibling = createElementWithSize("div", { id: "prev" });
      const target = createElementWithSize("article", { id: "target" });

      parent.appendChild(prevSibling);
      parent.appendChild(target);
      container.appendChild(parent);

      const { getByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "article",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const prevRow = getByText("prev").closest('[role="button"]');
      expect(prevRow).not.toBeNull();
      fireEvent.click(prevRow!);

      expect(onSelectElement).toHaveBeenCalledWith(prevSibling);
    });

    it("calls onSelectElement when clicking the parent", async () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const target = createElementWithSize("article", { id: "target" });

      parent.appendChild(target);
      container.appendChild(parent);

      const { getByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "article",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const parentRow = getByText("parent").closest('[role="button"]');
      expect(parentRow).not.toBeNull();
      fireEvent.click(parentRow!);

      expect(onSelectElement).toHaveBeenCalledWith(parent);
    });

    it("marks current element as not selectable when it is blacklisted", () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const target = createElementWithSize("br", { id: "target" });

      parent.appendChild(target);
      container.appendChild(parent);

      const { getByLabelText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "br",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const blacklistedRow = getByLabelText(/\(not selectable\)$/);
      expect(blacklistedRow).toBeInTheDocument();
      fireEvent.click(blacklistedRow);

      expect(onSelectElement).not.toHaveBeenCalled();
    });
  });

  describe("ancestor ellipsis", () => {
    it("shows ellipsis when ancestors are omitted", () => {
      const greatGrandparent = createElementWithSize("main", {
        id: "great-grandparent",
      });
      const grandparent = createElementWithSize("section", {
        id: "grandparent",
      });
      const parent = createElementWithSize("article", { id: "parent" });
      const target = createElementWithSize("div", { id: "target" });

      greatGrandparent.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(target);
      container.appendChild(greatGrandparent);

      const { getByLabelText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const ellipsisButton = getByLabelText(/omitted ancestor/);
      expect(ellipsisButton).toBeInTheDocument();
    });

    it("does not show ellipsis when no ancestors are omitted (parent at provider boundary)", () => {
      const provider = createElementWithSize("div");
      provider.setAttribute("data-anyclick-provider", "");
      const parent = createElementWithSize("section", { id: "parent" });
      const target = createElementWithSize("div", { id: "target" });

      provider.appendChild(parent);
      parent.appendChild(target);
      container.appendChild(provider);

      const { queryByLabelText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const ellipsisButton = queryByLabelText(/omitted ancestor/);
      expect(ellipsisButton).not.toBeInTheDocument();
    });

    it("opens ancestor chooser when clicking ellipsis", async () => {
      const greatGrandparent = createElementWithSize("main", {
        id: "great-grandparent",
      });
      const grandparent = createElementWithSize("section", {
        id: "grandparent",
      });
      const parent = createElementWithSize("article", { id: "parent" });
      const target = createElementWithSize("div", { id: "target" });

      greatGrandparent.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(target);
      container.appendChild(greatGrandparent);

      const { getByLabelText, getByRole } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const ellipsisButton = getByLabelText(/omitted ancestor/);
      fireEvent.click(ellipsisButton);

      const listbox = getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveFocus();
    });

    it("closes ancestor chooser on Escape without changing selection", async () => {
      const greatGrandparent = createElementWithSize("main", {
        id: "great-grandparent",
      });
      const grandparent = createElementWithSize("section", {
        id: "grandparent",
      });
      const parent = createElementWithSize("article", { id: "parent" });
      const target = createElementWithSize("div", { id: "target" });

      greatGrandparent.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(target);
      container.appendChild(greatGrandparent);

      const { getByLabelText, getByRole, queryByRole } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const ellipsisButton = getByLabelText(/omitted ancestor/);
      fireEvent.click(ellipsisButton);

      expect(getByRole("listbox")).toBeInTheDocument();

      fireEvent.keyDown(getByRole("listbox"), { key: "Escape" });

      await waitFor(() => {
        expect(queryByRole("listbox")).not.toBeInTheDocument();
      });

      expect(onSelectElement).not.toHaveBeenCalled();
    });

    it("selects ancestor and closes chooser on Enter", async () => {
      const greatGrandparent = createElementWithSize("main", {
        id: "great-grandparent",
      });
      const grandparent = createElementWithSize("section", {
        id: "grandparent",
      });
      const parent = createElementWithSize("article", { id: "parent" });
      const target = createElementWithSize("div", { id: "target" });

      greatGrandparent.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(target);
      container.appendChild(greatGrandparent);

      const { getByLabelText, getByRole, queryByRole } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const ellipsisButton = getByLabelText(/omitted ancestor/);
      fireEvent.click(ellipsisButton);

      expect(getByRole("listbox")).toBeInTheDocument();

      fireEvent.keyDown(getByRole("listbox"), { key: "Enter" });

      await waitFor(() => {
        expect(queryByRole("listbox")).not.toBeInTheDocument();
      });

      expect(onSelectElement).toHaveBeenCalledTimes(1);
      expect(onSelectElement).toHaveBeenCalledWith(grandparent);
    });

    it("supports keyboard navigation in ancestor chooser", async () => {
      const greatGrandparent = createElementWithSize("main", {
        id: "great-grandparent",
      });
      const grandparent = createElementWithSize("section", {
        id: "grandparent",
      });
      const parent = createElementWithSize("article", { id: "parent" });
      const target = createElementWithSize("div", { id: "target" });

      greatGrandparent.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(target);
      container.appendChild(greatGrandparent);

      const { getByLabelText, getAllByRole, getByRole } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const ellipsisButton = getByLabelText(/omitted ancestor/);
      fireEvent.click(ellipsisButton);

      const options = getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");

      fireEvent.keyDown(getByRole("listbox"), { key: "ArrowDown" });

      await waitFor(() => {
        expect(options[1]).toHaveAttribute("aria-selected", "true");
      });
    });

    it("has accessible ancestor chooser", async () => {
      const greatGrandparent = createElementWithSize("main", {
        id: "great-grandparent",
      });
      const grandparent = createElementWithSize("section", {
        id: "grandparent",
      });
      const parent = createElementWithSize("article", { id: "parent" });
      const target = createElementWithSize("div", { id: "target" });

      greatGrandparent.appendChild(grandparent);
      grandparent.appendChild(parent);
      parent.appendChild(target);
      container.appendChild(greatGrandparent);

      const { getByLabelText, getByRole, getAllByRole } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "div",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const ellipsisButton = getByLabelText(/omitted ancestor/);
      expect(ellipsisButton).toHaveAttribute("aria-haspopup", "listbox");
      expect(ellipsisButton).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(ellipsisButton);

      expect(ellipsisButton).toHaveAttribute("aria-expanded", "true");

      const listbox = getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-label", "Ancestor elements");

      const options = getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe("preserves #97 eligibility guards", () => {
    it("does not allow selecting Anyclick-owned UI elements", () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const target = createElementWithSize("article", { id: "target" });
      const anyClickUI = createElementWithSize("div");
      anyClickUI.setAttribute("data-anyclick-ui", "");

      parent.appendChild(target);
      parent.appendChild(anyClickUI);
      container.appendChild(parent);

      const { queryByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "article",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      expect(queryByText("next")).not.toBeInTheDocument();
    });

    it("allows selecting elements with highlight classes", () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const target = createElementWithSize("article", { id: "target" });
      const nextSibling = createElementWithSize("div", {
        id: "next",
        classes: ["anyclick-highlight-target"],
      });

      parent.appendChild(target);
      parent.appendChild(nextSibling);
      container.appendChild(parent);

      const { getByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "article",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      const nextRow = getByText("next").closest('[role="button"]');
      expect(nextRow).not.toBeNull();
      fireEvent.click(nextRow!);

      expect(onSelectElement).toHaveBeenCalledWith(nextSibling);
    });

    it("skips structural elements when finding relatives", () => {
      const parent = createElementWithSize("section", { id: "parent" });
      const target = createElementWithSize("article", { id: "target" });
      const br = createElementWithSize("br");
      const validSibling = createElementWithSize("div", { id: "next" });

      parent.appendChild(target);
      parent.appendChild(br);
      parent.appendChild(validSibling);
      container.appendChild(parent);

      const { getByText } = render(
        <ElementHierarchyNav
          targetElement={target}
          elementInfo={{
            tagName: "article",
            id: "target",
            classNames: [],
            selector: "#target",
          }}
          onSelectElement={onSelectElement}
        />
      );

      expect(getByText("next")).toBeInTheDocument();

      const nextRow = getByText("next").closest('[role="button"]');
      expect(nextRow).not.toBeNull();
      fireEvent.click(nextRow!);

      expect(onSelectElement).toHaveBeenCalledWith(validSibling);
    });
  });

  describe("header navigation scenario (issue #98 regression)", () => {
    function createElementWithSizeAndContent(
      tag: string,
      options: { id?: string; classes?: string[]; textContent?: string } = {}
    ) {
      const el = document.createElement(tag);
      if (options.id) el.id = options.id;
      if (options.classes) el.classList.add(...options.classes);
      if (options.textContent) el.textContent = options.textContent;
      Object.defineProperty(el, "getBoundingClientRect", {
        value: () => ({
          width: 100,
          height: 50,
          top: 0,
          left: 0,
          right: 100,
          bottom: 50,
        }),
      });
      return el;
    }

    function createSVGElement() {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      Object.defineProperty(svg, "getBoundingClientRect", {
        value: () => ({
          width: 32,
          height: 32,
          top: 0,
          left: 0,
          right: 32,
          bottom: 32,
        }),
      });
      return svg;
    }

    it("shows NEXT sibling when navigating to element with only blacklisted children", () => {
      // Simulates: <a><div.relative><svg/></div><span>anyclick</span></a>
      const link = createElementWithSizeAndContent("a", { id: "link" });
      const logoDiv = createElementWithSizeAndContent("div", {
        id: "logo-div",
        classes: ["relative"],
      });
      const svg = createSVGElement();
      const brandSpan = createElementWithSizeAndContent("span", {
        id: "brand",
        textContent: "anyclick",
      });

      logoDiv.appendChild(svg);
      link.appendChild(logoDiv);
      link.appendChild(brandSpan);
      container.appendChild(link);

      // When targeting the logo div, NEXT should show the span
      const { getByText, queryByText } = render(
        <ElementHierarchyNav
          targetElement={logoDiv}
          elementInfo={{
            tagName: "div",
            id: "logo-div",
            classNames: ["relative"],
            selector: "#logo-div",
          }}
          onSelectElement={onSelectElement}
        />
      );

      // Should show NEXT pointing to the span
      expect(getByText("next")).toBeInTheDocument();
      
      // Should NOT show CHILD (SVG is blacklisted)
      expect(queryByText("child")).not.toBeInTheDocument();
    });

    it("exact homepage header scenario: link with img+div inside div.relative and span sibling", () => {
      // Exact structure from homepage:
      // <a class="flex items-center gap-3 group">
      //   <div class="relative">
      //     <img src="/logo.png" />
      //     <div class="absolute opacity-0 ...">hover effect</div>
      //   </div>
      //   <span>anyclick</span>
      // </a>
      const link = createElementWithSizeAndContent("a", { 
        id: "link",
        classes: ["flex", "items-center", "gap-3", "group"]
      });
      const logoContainer = createElementWithSizeAndContent("div", {
        classes: ["relative"],
      });
      const img = createElementWithSizeAndContent("img", {});
      const hoverEffect = createElementWithSizeAndContent("div", {
        classes: ["absolute", "opacity-0"],
      });
      const brandSpan = createElementWithSizeAndContent("span", {
        textContent: "anyclick",
        classes: ["text-xl", "font-semibold"],
      });

      logoContainer.appendChild(img);
      logoContainer.appendChild(hoverEffect);
      link.appendChild(logoContainer);
      link.appendChild(brandSpan);
      container.appendChild(link);

      // Test 1: When on span, PREV should be logoContainer
      const prevSibling = findEligiblePrevSibling(brandSpan);
      expect(prevSibling).toBe(logoContainer);

      // Test 2: When on logoContainer, NEXT should be brandSpan  
      const nextSibling = findEligibleNextSibling(logoContainer);
      expect(nextSibling).toBe(brandSpan);

      // Test 3: When on logoContainer, CHILD should be img (first eligible child)
      const firstChild = findEligibleFirstChild(logoContainer);
      expect(firstChild).toBe(img);

      // Test 4: Render the component targeting logoContainer and verify NEXT shows
      const { getByText, rerender } = render(
        <ElementHierarchyNav
          targetElement={logoContainer}
          elementInfo={{
            tagName: "div",
            id: "",
            classNames: ["relative"],
            selector: "div.relative",
          }}
          onSelectElement={onSelectElement}
        />
      );

      expect(getByText("next")).toBeInTheDocument();
      expect(getByText("child")).toBeInTheDocument();
      expect(getByText("parent")).toBeInTheDocument();

      // Test 5: Clicking NEXT should select the span
      const nextRow = getByText("next").closest('[role="button"]');
      expect(nextRow).not.toBeNull();
      fireEvent.click(nextRow!);
      expect(onSelectElement).toHaveBeenCalledWith(brandSpan);
    });

    it("allows bidirectional navigation: span -> div -> span", () => {
      const link = createElementWithSizeAndContent("a", { id: "link" });
      const logoDiv = createElementWithSizeAndContent("div", {
        id: "logo-div",
        classes: ["relative"],
      });
      const brandSpan = createElementWithSizeAndContent("span", {
        id: "brand",
        textContent: "anyclick",
      });

      link.appendChild(logoDiv);
      link.appendChild(brandSpan);
      container.appendChild(link);

      // From span, PREV should be the div
      const prevSibling = findEligiblePrevSibling(brandSpan);
      expect(prevSibling).toBe(logoDiv);

      // From div, NEXT should be the span
      const nextSibling = findEligibleNextSibling(logoDiv);
      expect(nextSibling).toBe(brandSpan);
    });

    it("handles elements with zero bounding rect but with text content", () => {
      // Some CSS like display:contents causes zero bounding rect
      const parent = createElementWithSizeAndContent("div", { id: "parent" });
      const textSpan = document.createElement("span");
      textSpan.id = "text-span";
      textSpan.textContent = "visible text";
      // Simulate display:contents or similar - zero bounding rect
      Object.defineProperty(textSpan, "getBoundingClientRect", {
        value: () => ({
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }),
      });

      parent.appendChild(textSpan);
      container.appendChild(parent);

      // Element with text content should be eligible even with zero rect
      expect(isEligibleForNavigation(textSpan)).toBe(true);
    });

    it("hides elements with zero rect AND no text content", () => {
      const parent = createElementWithSizeAndContent("div", { id: "parent" });
      const emptyDiv = document.createElement("div");
      emptyDiv.id = "empty-div";
      // Zero bounding rect and no text content
      Object.defineProperty(emptyDiv, "getBoundingClientRect", {
        value: () => ({
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }),
      });

      parent.appendChild(emptyDiv);
      container.appendChild(parent);

      // Empty element with zero rect should not be eligible
      expect(isEligibleForNavigation(emptyDiv)).toBe(false);
    });
  });
});
