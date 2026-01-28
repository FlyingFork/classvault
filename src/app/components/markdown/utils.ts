/**
 * Generates a URL-safe slug from heading text.
 * - Lowercases the text
 * - Replaces spaces with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Handles deduplication via suffix (-1, -2, etc.)
 */
export function generateSlug(text: string, existingSlugs: Set<string>): string {
  // Extract text content, stripping any markdown formatting
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseSlug) {
    return "";
  }

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

export interface Heading {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Extracts all headings from markdown content string.
 * Uses a simple regex-based approach for performance.
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const existingSlugs = new Set<string>();

  // Match markdown headings (# through ######)
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
    const text = match[2].trim();

    // Skip empty headings
    if (!text) continue;

    // Strip inline code backticks and other markdown formatting for slug
    const cleanText = text
      .replace(/`([^`]+)`/g, "$1") // inline code
      .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
      .replace(/\*([^*]+)\*/g, "$1") // italic
      .replace(/_([^_]+)_/g, "$1") // underscore italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // links

    const id = generateSlug(cleanText, existingSlugs);

    if (id) {
      headings.push({ id, text, level });
    }
  }

  return headings;
}

/**
 * Scrolls to an element by ID with offset for fixed navbar.
 */
export function scrollToHeading(
  id: string,
  behavior: ScrollBehavior = "smooth",
): void {
  const element = document.getElementById(id);
  if (!element) return;

  const navbarOffset = 100; // Account for fixed navbar
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.scrollY - navbarOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });
}

/**
 * Copies text to clipboard with fallback for older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern clipboard API first
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for older browsers
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Generates full URL with anchor for sharing.
 */
export function generateShareUrl(headingId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}#${headingId}`;
}
