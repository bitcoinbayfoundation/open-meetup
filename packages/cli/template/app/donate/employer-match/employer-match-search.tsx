"use client";

import { useState } from "react";
import config from "@/site.config";

const companies = [
  { name: "Apple", ratio: "1:1", max: "$10,000" },
  { name: "Microsoft", ratio: "1:1", max: "$15,000" },
  { name: "Google", ratio: "1:1", max: "$10,000" },
  { name: "Meta", ratio: "2:1", max: "$15,000" },
  { name: "Amazon", ratio: "1:1", max: "$2,000" },
  { name: "IBM", ratio: "1:1", max: "$5,000" },
  { name: "Intel", ratio: "1.5:1", max: "$10,000" },
  { name: "Cisco", ratio: "1:1", max: "$10,000" },
  { name: "Oracle", ratio: "1:1", max: "$5,000" },
  { name: "Salesforce", ratio: "1:1", max: "$5,000" },
  { name: "Adobe", ratio: "1:1", max: "$10,000" },
  { name: "Netflix", ratio: "1:1", max: "$5,000" },
  { name: "Bank of America", ratio: "1:1", max: "$5,000" },
  { name: "JP Morgan Chase", ratio: "1:1", max: "$2,500" },
  { name: "Goldman Sachs", ratio: "1:1", max: "$3,500" },
];

export default function EmployerMatchSearch() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCompany = companies.find((c) => c.name === selected);

  return (
    <section className="px-6 pb-16 max-w-5xl mx-auto">
      <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-8">
        search_your_employer
      </h2>
      <div className="mb-6">
        <div className="flex items-center bg-t-dark-alt border border-t-accent/30 focus-within:border-t-accent transition-colors">
          <span className="font-mono text-t-accent text-sm pl-4 pr-2 select-none">
            $
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
            placeholder="grep company_name..."
            className="w-full bg-transparent text-t-surface font-mono text-sm py-4 pr-4 outline-none placeholder:text-t-surface/40"
          />
        </div>
      </div>

      {/* Selected Company Detail */}
      {selectedCompany && (
        <div className="mb-6 bg-t-dark-alt border-l-4 border-t-accent p-6">
          <h3 className="font-mono text-lg font-semibold text-t-accent mb-3">
            {selectedCompany.name}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-xs text-t-surface/70 mb-1">
                MATCH RATIO
              </p>
              <p className="font-mono text-xl text-t-surface">
                {selectedCompany.ratio}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-t-surface/70 mb-1">
                ANNUAL MAX
              </p>
              <p className="font-mono text-xl text-t-surface">
                {selectedCompany.max}
              </p>
            </div>
          </div>
          <p className="text-t-surface/80 text-sm mt-4">
            Contact your employer&apos;s HR department to confirm their current
            matching gift policy and submit your match request for your donation
            to {config.org.name}.
          </p>
        </div>
      )}

      {/* Company List */}
      <div className="grid gap-2">
        {filtered.map((company) => (
          <button
            key={company.name}
            onClick={() => setSelected(company.name)}
            className={`w-full text-left bg-t-dark-alt border p-4 font-mono text-sm transition-colors flex items-center justify-between cursor-pointer ${
              selected === company.name
                ? "border-t-accent bg-t-primary/20"
                : "border-t-accent/20 hover:border-t-accent/50"
            }`}
          >
            <span className="text-t-surface">{company.name}</span>
            <span className="flex gap-6 text-t-surface/80">
              <span>
                <span className="text-t-accent">{company.ratio}</span> match
              </span>
              <span>
                max <span className="text-t-accent">{company.max}</span>
              </span>
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="bg-t-dark-alt border border-t-accent/20 p-6 text-center">
            <p className="font-mono text-t-surface/70 text-sm">
              No matching companies found. Your employer may still offer
              matching &mdash; contact your HR department.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
