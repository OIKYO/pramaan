import { TextLink } from "@/components/ui/TextLink";

export function ReliabilityMethod({ generator, runner }: { generator: string; runner: string }) {
  return (
    <section className="flex flex-col gap-3 px-5 py-8 pb-16 sm:px-8 lg:px-12" aria-labelledby="method">
      <h2 id="method" className="text-2xl">How this was measured</h2>
      <ul className="flex max-w-3xl list-disc flex-col gap-2 pl-5 text-ink">
        <li>
          The posters are drawn by a script with every problem planted on purpose, so the right answer for each one is known
          before anything reads it. The same script records a perfect reading, and with it every poster fails exactly its planted
          checks: that is part of the automated tests.
        </li>
        <li>
          Each run sends the poster image to the live AI reader with the cache turned off, then the second read, the name matching,
          the visual checks and every rule run as they do for a real upload. A run the reader couldn't finish isn't scored.
        </li>
        <li>
          A check <em>catches</em> a problem when it fails on the poster it was planted on, and raises a <em>false flag</em> when it
          fails anywhere else. On a poster with a planted guarantee, the AI's own guarantee and tone flags are fair and don't count.
          The reader's questions for a person (numbers it wasn't sure of) are counted separately, because asking instead of
          guessing is how Pramaan is meant to work.
        </li>
        <li>
          All of it is fictional: an imaginary coaching institute, its people and numbers. Real posters are messier, so read these
          numbers as a floor for what the checks can do, not a promise about every poster.
        </li>
        <li>
          Reproduce it with <TextLink to={runner}>scripts/reliability.py</TextLink>; the posters come from{" "}
          <TextLink to={generator}>tools/make_test_posters.py</TextLink>.
        </li>
      </ul>
    </section>
  );
}
