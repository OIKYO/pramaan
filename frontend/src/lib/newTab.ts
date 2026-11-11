/** Open a URL in a new tab the way a link does. Pop-up blockers stop window.open, not a person's click on a link. */
export function openInNewTab(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
