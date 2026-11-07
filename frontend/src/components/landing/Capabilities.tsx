const ITEMS = [
  {
    title: "Your rulebook, not a guess",
    text: "Fees, course names, results figures, branch contacts and the toppers register are your approved records. A poster that disagrees is blocked, with the right value as the fix.",
  },
  {
    title: "Consent before publicity",
    text: "A student appears only with signed consent taken after the result, for that channel, still in date, and signed by a guardian if they're a minor. Consent files never go to the AI.",
  },
  {
    title: "Two readers for every number",
    text: "Ranks, fees and phone numbers are read by the AI and again by OCR. When they disagree, a person confirms it instead of the software guessing.",
  },
  {
    title: "Built for many branches",
    text: "Branch staff see their branch, regional managers their region, head office everything. Nobody approves their own poster, and overrides need a written reason.",
  },
];

/** What makes the checks trustworthy. */
export function Capabilities() {
  return (
    <section className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:py-20">
      <h2 className="text-2xl md:col-span-2">Checks you can explain to a regulator</h2>
      {ITEMS.map((item) => (
        <div key={item.title} className="flex flex-col gap-2 border-t border-line pt-5">
          <h3 className="text-base">{item.title}</h3>
          <p className="text-pretty text-muted-text">{item.text}</p>
        </div>
      ))}
    </section>
  );
}
