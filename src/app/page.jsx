"use client";

import Link from "next/link";
import Image from "next/image";

const placeholderSketch =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='320' viewBox='0 0 400 320' fill='none'%3E%3Crect width='400' height='320' rx='24' fill='%23F3F4F6'/%3E%3Cpath d='M130 180c10-60 120-60 130 0M180 150c0 12-10 22-22 22s-22-10-22-22 10-22 22-22 22 10 22 22Zm84 0c0 12-10 22-22 22s-22-10-22-22 10-22 22-22 22 10 22 22ZM170 214c24 18 56 18 80 0' stroke='%239CA3AF' stroke-width='8' stroke-linecap='round'/%3E%3Crect x='140' y='52' width='120' height='32' rx='16' fill='%23E5E7EB'/%3E%3Ctext x='200' y='73' text-anchor='middle' fill='%236B7280' font-size='14' font-family='Arial' font-weight='600'%3ESuspect Sketch%3C/text%3E%3C/svg%3E";

const placeholderGallery =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='220' viewBox='0 0 360 220' fill='none'%3E%3Crect width='360' height='220' rx='20' fill='%23F3F4F6'/%3E%3Cpath d='M80 152c18-58 102-58 120 0M120 124c0 12-9 22-20 22s-20-10-20-22 9-22 20-22 20 10 20 22Zm84 0c0 12-9 22-20 22s-20-10-20-22 9-22 20-22 20 10 20 22ZM140 172c20 16 50 16 70 0' stroke='%239CA3AF' stroke-width='8' stroke-linecap='round'/%3E%3Ctext x='180' y='56' text-anchor='middle' fill='%236B7280' font-size='16' font-family='Arial' font-weight='600'%3EPlayer Sketch%3C/text%3E%3C/svg%3E";

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className='text-center max-w-3xl mx-auto mb-12'>
      {eyebrow && (
        <p className='text-sm uppercase tracking-[0.2em] text-blue-600 font-semibold mb-3'>
          {eyebrow}
        </p>
      )}
      <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4'>
        {title}
      </h2>
      {subtitle && <p className='text-lg text-gray-600'>{subtitle}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section className='bg-white py-16 sm:py-20' id='top'>
      <div className='max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center'>
        <div className='space-y-6'>
          <p className='text-sm uppercase tracking-[0.2em] text-blue-600 font-semibold'>
            Draw &amp; Order
          </p>
          <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight'>
            Think you have what it takes to help identify the baddies? Prove it.
          </h1>
          <p className='text-lg text-gray-600'>
            Step into the role of a police sketch artist: read fictional witness
            descriptions, draw the make-believe suspect, and see how close you
            get to the real (fake) face.
          </p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link
              href='/draw'
              className='inline-flex justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-blue-700 transition'
            >
              Play Now
            </Link>
            <a
              href='#how-it-works'
              className='inline-flex justify-center rounded-xl border border-gray-300 px-6 py-3 text-gray-800 font-semibold hover:border-gray-400 hover:shadow-sm transition'
            >
              See How It Works
            </a>
          </div>
          <div className='grid grid-cols-2 gap-4 pt-4'>
            <div className='rounded-xl border border-gray-200 p-4 shadow-sm'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Witness description
              </p>
              <p className='mt-2 text-sm text-gray-700'>
                {
                  "Tall male, sharp jawline, short dark hair, thin eyebrows, faint scar on the right cheek, wearing a navy hoodie."
                }
              </p>
            </div>
            <div className='rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-center bg-linear-to-br from-gray-50 to-white'>
              <Image
                src={placeholderSketch}
                alt='Sample suspect sketch'
                width={400}
                height={320}
                className='rounded-lg shadow'
                priority
              />
            </div>
          </div>
        </div>
        <div className='rounded-2xl bg-gray-50 border border-gray-200 p-6 shadow-md space-y-6'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg'>
              01
            </div>
            <div>
              <p className='text-sm text-gray-500'>AI-provided witness brief</p>
              <p className='text-lg font-semibold text-gray-900'>
                Decode the clues
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg'>
              02
            </div>
            <div>
              <p className='text-sm text-gray-500'>Draw or upload</p>
              <p className='text-lg font-semibold text-gray-900'>
                Craft your sketch
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg'>
              03
            </div>
            <div>
              <p className='text-sm text-gray-500'>AI-powered scoring</p>
              <p className='text-lg font-semibold text-gray-900'>
                Get matched accuracy
              </p>
            </div>
          </div>
          <div className='rounded-xl bg-white border border-gray-200 p-4 shadow-sm'>
            <p className='text-sm text-gray-600'>
              {
                "It feels like CSI meets Pictionary. The difficulty scaling keeps it addictive."
              }
            </p>
            <p className='mt-2 text-xs uppercase text-gray-500 font-semibold'>
              Community beta tester
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Read a Witness Description",
      body: "Each round starts with an AI-generated statement that highlights key facial features and clues.",
      icon: "📝",
    },
    {
      title: "Draw the Suspect",
      body: "Use the canvas tools or upload a sketch. Add details, adjust colors, and refine until it feels right.",
      icon: "✏️",
    },
    {
      title: "Get Your Accuracy Score",
      body: "Our AI compares your sketch to the real suspect portrait and gives you a similarity score instantly.",
      icon: "🎯",
    },
  ];

  return (
    <section className='bg-white py-16 sm:py-20' id='how-it-works'>
      <div className='max-w-7xl mx-auto px-4'>
        <SectionHeading
          eyebrow='How it works'
          title='The 3-step sketch artist challenge'
          subtitle='A fast loop that keeps you sketching, iterating, and improving.'
        />
        <div className='grid gap-6 md:grid-cols-3'>
          {steps.map((step) => (
            <div
              key={step.title}
              className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-6 bg-white flex flex-col gap-3'
            >
              <div className='text-3xl'>{step.icon}</div>
              <h3 className='text-xl font-semibold text-gray-900'>
                {step.title}
              </h3>
              <p className='text-gray-600'>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// function DifficultyCards() {
//   const options = [
//     {
//       level: "Easy",
//       description:
//         "Highly detailed descriptions to guide every line of your sketch.",
//       color: "from-green-50 to-white",
//       query: "easy",
//     },
//     {
//       level: "Medium",
//       description:
//         "Balanced clues that test your focus and memory for features.",
//       color: "from-amber-50 to-white",
//       query: "medium",
//     },
//     {
//       level: "Hard",
//       description: "Minimal and vague clues. Good luck, detective.",
//       color: "from-rose-50 to-white",
//       query: "hard",
//     },
//   ];

//   return (
//     <section className='bg-white py-16 sm:py-20'>
//       <div className='max-w-7xl mx-auto px-4'>
//         <SectionHeading
//           eyebrow='Choose your difficulty'
//           title='Start at your level, climb to master detective'
//           subtitle='Each tier tweaks the AI-generated clues to keep the challenge fresh.'
//         />
//         <div className='grid gap-6 md:grid-cols-3'>
//           {options.map((option) => (
//             <div
//               key={option.level}
//               className={`rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-6 bg-linear-to-br ${option.color} flex flex-col gap-4`}
//             >
//               <div className='flex items-center justify-between'>
//                 <h3 className='text-2xl font-bold text-gray-900'>
//                   {option.level}
//                 </h3>
//                 <span className='text-lg'>🚨</span>
//               </div>
//               <p className='text-gray-600 flex-1'>{option.description}</p>
//               <Link
//                 href={`/play?difficulty=${option.query}`}
//                 className='inline-flex justify-center rounded-xl bg-gray-900 px-4 py-2 text-white font-semibold hover:bg-gray-800 transition'
//               >
//                 Play {option.level}
//               </Link>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

function ToolkitGrid() {
  const tools = [
    {
      name: "Pen tool",
      icon: "✒️",
      detail: "Precise strokes for outlines and shading.",
    },
    {
      name: "Eraser",
      icon: "🧽",
      detail: "Fine-tune mistakes without restarting.",
    },
    {
      name: "Color picker",
      icon: "🎨",
      detail: "Match tones for hair, eyes, and clothing.",
    },
    {
      name: "Brush size slider",
      icon: "📏",
      detail: "Adjust thickness for every detail.",
    },
    {
      name: "Clear button",
      icon: "🧹",
      detail: "Reset instantly when you want a fresh take.",
    },
    {
      name: "Upload drawing",
      icon: "🖼️",
      detail: "Bring in sketches from your tablet or paper.",
    },
    {
      name: "8.5×11 portrait canvas",
      icon: "🗒️",
      detail: "A familiar workspace sized for suspects.",
    },
  ];

  return (
    <section className='bg-white py-16 sm:py-20'>
      <div className='max-w-7xl mx-auto px-4'>
        <SectionHeading
          eyebrow='Sketch artist toolkit'
          title='Tools designed for precise suspect portraits'
          subtitle='Everything you need to capture a description quickly and accurately.'
        />
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {tools.map((tool) => (
            <div
              key={tool.name}
              className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-6 bg-white flex items-start gap-4'
            >
              <span className='text-2xl'>{tool.icon}</span>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {tool.name}
                </h3>
                <p className='text-gray-600 text-sm mt-1'>{tool.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiSection() {
  const leftFeatures = [
    "AI-generated suspect portraits",
    "AI-generated witness descriptions",
    "Difficulty scaling",
  ];

  const rightFeatures = [
    "AI scoring engine",
    "Embedding similarity",
    "Reveal original suspect",
    "Score history per user",
  ];

  return (
    <section className='bg-white py-16 sm:py-20'>
      <div className='max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-start'>
        <div>
          <SectionHeading
            eyebrow='AI under the hood'
            title='Smart generation and evaluation built-in'
            subtitle='Every round is powered by AI, from creating suspects to grading your sketches.'
          />
          <div className='grid sm:grid-cols-2 gap-4'>
            <div className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-6 bg-white'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                Content Generation
              </h3>
              <ul className='space-y-2 text-gray-600'>
                {leftFeatures.map((item) => (
                  <li key={item} className='flex items-center gap-2'>
                    <span className='text-blue-600'>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-6 bg-white'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                Scoring &amp; Feedback
              </h3>
              <ul className='space-y-2 text-gray-600'>
                {rightFeatures.map((item) => (
                  <li key={item} className='flex items-center gap-2'>
                    <span className='text-emerald-600'>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className='rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-md space-y-4'>
          <p className='text-sm uppercase tracking-[0.2em] text-gray-500 font-semibold'>
            Live example
          </p>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='rounded-xl bg-white p-4 shadow-sm border border-gray-200'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Witness brief
              </p>
              <p className='mt-2 text-sm text-gray-700'>
                {
                  "Woman in late 20s, wavy auburn hair, silver nose ring, freckled cheeks, wearing a green jacket."
                }
              </p>
            </div>
            <div className='rounded-xl bg-white p-4 shadow-sm border border-gray-200'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Your sketch upload
              </p>
              <Image
                src={placeholderSketch}
                alt='Sketch preview'
                width={400}
                height={320}
                className='rounded-lg shadow'
              />
            </div>
            <div className='rounded-xl bg-white p-4 shadow-sm border border-gray-200'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                AI score
              </p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>87%</p>
              <p className='text-sm text-gray-600'>
                Similarity to real suspect portrait
              </p>
            </div>
            <div className='rounded-xl bg-white p-4 shadow-sm border border-gray-200'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Feedback
              </p>
              <p className='mt-2 text-sm text-gray-700'>
                Strong match on bone structure. Adjust eyebrow thickness and
                lighten hair tone for a perfect score.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressSection() {
  return (
    <section className='bg-white py-16 sm:py-20'>
      <div className='max-w-7xl mx-auto px-4'>
        <SectionHeading
          eyebrow='Track your improvement'
          title='See every sketch and score in one place'
          subtitle='Log in to keep a running history of drawings, scores, and rival detectives.'
        />
        <div className='grid lg:grid-cols-2 gap-8 items-center'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-4 bg-white min-h-[140px]'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Past drawings
              </p>
              <div className='mt-3 grid grid-cols-3 gap-2'>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className='rounded-lg bg-gray-50 border border-gray-200 p-2 flex items-center justify-center'
                  >
                    <Image
                      src={placeholderSketch}
                      alt={`Past drawing ${i}`}
                      width={120}
                      height={96}
                      className='rounded-md'
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-4 bg-white min-h-[140px]'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Score history
              </p>
              <div className='mt-4 h-20 bg-linear-to-r from-emerald-200 via-blue-200 to-indigo-200 rounded-lg' />
            </div>
            <div className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-4 bg-white min-h-[140px]'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Personal improvement
              </p>
              <div className='mt-4 h-28 rounded-lg bg-linear-to-b from-white to-blue-50 border border-dashed border-blue-200 flex items-center justify-center text-blue-700 font-semibold'>
                +14% week over week
              </div>
            </div>
            <div className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-4 bg-white min-h-[140px]'>
              <p className='text-xs uppercase text-gray-500 font-semibold'>
                Leaderboard preview
              </p>
              <div className='mt-3 space-y-2 text-sm text-gray-700'>
                <p>1. Agent Lin — 94%</p>
                <p>2. SketchSmith — 92%</p>
                <p>3. You — 87%</p>
                <p>4. PixelSleuth — 85%</p>
              </div>
            </div>
          </div>
          <div className='rounded-2xl bg-gray-50 border border-gray-200 p-8 shadow-md space-y-6'>
            <h3 className='text-2xl font-bold text-gray-900'>
              Save every suspect you sketch
            </h3>
            <p className='text-gray-600 text-lg'>
              Draw &amp; Order keeps a trail of your cases so you can study
              patterns, compete on the leaderboard, and watch your accuracy
              climb.
            </p>
            <Link
              href='/login'
              className='inline-flex justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-blue-700 transition'
            >
              Sign In to Save Progress
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  const galleryItems = [1, 2, 3, 4];
  return (
    <section className='bg-white py-16 sm:py-20'>
      <div className='max-w-7xl mx-auto px-4'>
        <SectionHeading
          eyebrow='Community'
          title='Show off your detective skills'
          subtitle='Share sketches, compare notes, and swap strategies with fellow artists.'
        />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {galleryItems.map((item) => (
            <div
              key={item}
              className='rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 p-4 bg-white flex flex-col gap-3'
            >
              <Image
                src={placeholderGallery}
                alt={`Community sketch ${item}`}
                width={360}
                height={220}
                className='rounded-lg'
              />
              <p className='text-sm text-gray-600'>
                Detective #{item} • Similarity {80 + item}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCTA() {
  const footerLinks = [
    { label: "About", href: "#top" },
    { label: "FAQ", href: "#how-it-works" },
    { label: "Privacy", href: "#" },
  ];

  return (
    <section className='bg-white py-16 sm:py-20 border-t border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 text-center space-y-6'>
        <h3 className='text-3xl sm:text-4xl font-extrabold text-gray-900'>
          Ready to sketch your first suspect?
        </h3>
        <div className='flex justify-center'>
          <Link
            href='/play'
            className='inline-flex justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-blue-700 transition'
          >
            Play Now
          </Link>
        </div>
        <div className='flex justify-center gap-6 text-sm text-gray-600'>
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className='hover:text-gray-900'
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className='bg-white text-gray-900'>
      <Hero />
      <HowItWorks />
      {/* <DifficultyCards /> */}
      <ToolkitGrid />
      <AiSection />
      <ProgressSection />
      <CommunitySection />
      <FooterCTA />
    </main>
  );
}
