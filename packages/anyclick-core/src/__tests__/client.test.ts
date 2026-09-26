import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnyclickClient, createAnyclickClient } from "../client";
import type { AnyclickAdapter, AnyclickPayload } from "../types";

const createMockAdapter = (): AnyclickAdapter => ({
  submitAnyclick: vi.fn().mockResolvedValue(undefined),
});

describe("AnyclickClient", () => {
  let client: AnyclickClient;
  let adapter: AnyclickAdapter;

  beforeEach(() => {
    document.body.innerHTML = "";
    adapter = createMockAdapter();
  });

  afterEach(() => {
    client?.detach();
  });

  describe("attach", () => {
    it("should attach to global document when no container specified", () => {
      client = createAnyclickClient({ adapter });
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      client.attach();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "contextmenu",
        expect.any(Function),
        false,
      );
    });

    it("should attach to container's ownerDocument when container is in an iframe", () => {
      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument!;
      const container = iframeDoc.createElement("div");
      container.className = "iframe-container";
      iframeDoc.body.appendChild(container);

      client = createAnyclickClient({ adapter, container });
      const iframeAddEventListenerSpy = vi.spyOn(iframeDoc, "addEventListener");
      const mainAddEventListenerSpy = vi.spyOn(document, "addEventListener");

      client.attach();

      expect(iframeAddEventListenerSpy).toHaveBeenCalledWith(
        "contextmenu",
        expect.any(Function),
        true,
      );
      expect(mainAddEventListenerSpy).not.toHaveBeenCalledWith(
        "contextmenu",
        expect.any(Function),
        expect.anything(),
      );
    });

    it("should use container's ownerDocument for events in alternate document", () => {
      const altDoc = document.implementation.createHTMLDocument("alt");
      const container = altDoc.createElement("div");
      container.className = "alt-container";
      altDoc.body.appendChild(container);

      client = createAnyclickClient({ adapter, container });
      const altDocAddEventListenerSpy = vi.spyOn(altDoc, "addEventListener");

      client.attach();

      expect(altDocAddEventListenerSpy).toHaveBeenCalled();
      expect(container.ownerDocument).toBe(altDoc);
    });
  });

  describe("setContainer", () => {
    it("should re-attach to new document when container changes to iframe element", () => {
      const mainContainer = document.createElement("div");
      document.body.appendChild(mainContainer);

      client = createAnyclickClient({ adapter, container: mainContainer });
      client.attach();

      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentDocument!;
      const iframeContainer = iframeDoc.createElement("div");
      iframeDoc.body.appendChild(iframeContainer);

      const iframeAddEventListenerSpy = vi.spyOn(iframeDoc, "addEventListener");

      client.setContainer(iframeContainer);

      expect(iframeAddEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe("contextmenu handling with iframe containers", () => {
    it("should receive contextmenu events from iframe content", () => {
      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument!;
      const container = iframeDoc.createElement("div");
      container.className = "iframe-container";
      const target = iframeDoc.createElement("button");
      target.className = "target-button";
      container.appendChild(target);
      iframeDoc.body.appendChild(container);

      client = createAnyclickClient({ adapter, container });

      let receivedElement: Element | null = null;
      client.onContextMenu = (_event, element) => {
        receivedElement = element;
        return true;
      };

      client.attach();

      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      });

      target.dispatchEvent(event);

      expect(receivedElement).toBe(target);
    });
  });
});
