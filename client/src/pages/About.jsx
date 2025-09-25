import React from "react";
import aboutImg from "../assets/images/about_img.jpg";
import { FaExternalLinkAlt } from "react-icons/fa";

const About = () => {
  return (
    <div className="bg-neutral-50 text-neutral-900">
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            About
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-2">
            Learn more about the team behind TravelMint{" "}
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Image / brand */}
            <div className="p-8 flex items-center justify-center bg-neutral-50">
              <img
                src={aboutImg}
                alt="TravelMint Group brand illustration"
                className="object-contain drop-shadow-sm rounded-md"
              />
            </div>

            {/* Content */}
            <div className="p-8 space-y-4">
              <h2 className="text-2xl font-semibold">TravelMint Group</h2>
              <p className="text-neutral-700">
                TravelMint is crafted by TravelMint Group with a focus on speed,
                simplicity, and a great booking experience. We care about
                consistency across pages, accessibility, and making trip
                management feel effortless.
              </p>

              <div className="pt-2">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2">
                  Find us online
                </h3>
                <ul className="flex flex-wrap gap-3">
                  <li>
                    <a
                      href="https://github.com/y-shubham"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                    >
                      GitHub <FaExternalLinkAlt aria-hidden />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://linkedin.com/in/printshubham"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                    >
                      LinkedIn <FaExternalLinkAlt aria-hidden />
                    </a>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-neutral-600">
                This project is developed by{" "}
                <span className="font-medium">TravelMint Group</span>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
