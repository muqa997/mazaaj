type Section = { heading: string; body: string };

export default function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-extrabold text-primary">{title}</h1>
        <p className="mb-8 text-xs text-primary/40">{lastUpdated}</p>
        <p className="mb-10 leading-loose text-primary/60">{intro}</p>

        <div className="flex flex-col gap-8">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="mb-2 text-lg font-bold text-primary">{section.heading}</h2>
              <p className="leading-loose text-primary/60">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
