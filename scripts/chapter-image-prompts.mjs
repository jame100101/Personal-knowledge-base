import fs from 'node:fs'
const chapters = JSON.parse(fs.readFileSync('app/data/chapter-overviews.json', 'utf8'))
const prompts = chapters.map((c) => ({
  id: c.id,
  output: `app/public${c.image}`,
  prompt: `Use case: infographic-diagram. NEW chapter overview, reference image ONLY for consistent series style. Replace ALL original labels. Central title exactly "${c.title}". Exactly ${c.modules.length} surrounding modules, each once: ${c.modules.map((m, i) => `${String(i + 1).padStart(2, '0')} ${m}`).join('; ')}. ${c.mode === 'choices' ? 'Independent optional branches, arrows from center to each module, NO sequential arrows.' : 'Arrows show numbered learning sequence; no final-to-first arrow.'} Landscape 16:9, clean blue white pale gray, softly dimensional relevant technical icons, generous whitespace, large accurate Chinese labels, no small print, no extra text or watermark. Context (do not print): ${c.summary}`,
}))
console.log(JSON.stringify(prompts, null, 2))
