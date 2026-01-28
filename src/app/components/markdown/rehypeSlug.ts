import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import type { Plugin } from "unified";
import { generateSlug } from "./utils";

/**
 * Rehype plugin that injects IDs into heading elements.
 * IDs are generated from heading text content and deduplicated.
 */
const rehypeSlug: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const existingSlugs = new Set<string>();

    visit(tree, "element", (node: Element) => {
      // Check if this is a heading element
      if (
        node.tagName === "h1" ||
        node.tagName === "h2" ||
        node.tagName === "h3" ||
        node.tagName === "h4" ||
        node.tagName === "h5" ||
        node.tagName === "h6"
      ) {
        // Extract text content from heading
        const text = extractTextContent(node);

        if (text) {
          const id = generateSlug(text, existingSlugs);

          if (id) {
            // Set the id attribute on the heading
            node.properties = node.properties || {};
            node.properties.id = id;
          }
        }
      }
    });
  };
};

/**
 * Recursively extracts text content from an element node.
 */
function extractTextContent(node: Element): string {
  let text = "";

  if (node.children) {
    for (const child of node.children) {
      if (child.type === "text") {
        text += child.value;
      } else if (child.type === "element") {
        text += extractTextContent(child);
      }
    }
  }

  return text.trim();
}

export default rehypeSlug;
