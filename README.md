# Harmonic Studio

A music theory tool that actually doesn't suck. Calculate pitch shifts, generate chords, build progressions, analyze YouTube tracks, and stare at a Circle of Fifths that actually looks good—all while vibing at A=432Hz because we're fancy like that.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-16-black.svg)
![Vibes](https://img.shields.io/badge/vibes-immaculate-ff69b4.svg)

## What's This Thing Do?

### Pitch & Scale Calculator

Ever had a fire sample in C but your beat's in F# Minor Phrygian Dominant? This tells you exactly how many semitones to pitch that thing. No more trial and error, no more "does +7 sound right?" Just facts.

Works with 14 different scales because sometimes you're feeling Dorian, sometimes you're feeling Phrygian, and sometimes you just want that Blues scale energy.

- Visual display of all notes in your scale
- Up/down indicators so you know which direction to pitch
- Works for any key combination your weird producer brain can think of

### Chord Generator

Look, we've all been there. Staring at the piano roll at 3am, trying to make a chord that doesn't sound like ass. This thing helps.

- 12 chord presets (Major, Minor, the weird ones, all of it)
- Click notes manually if you're feeling creative
- **Random button** for when your brain is fried and you need inspiration
- **Scale lock** so your random chords actually stay in key (revolutionary, I know)
- Play button that goes "beep boop" so you can hear if it slaps

### Progression Builder

Build entire chord progressions up to 16 bars. Set your BPM (yes, the textbox is actually typeable now), pick your time signature (yes, even 7/8 if you're one of *those* people), and export the whole thing as MIDI.

No more playing each chord into your DAW one by one like a caveman. Just click, export, drag into Ableton, done.

- Supports 3/4, 4/4, 5/4, 6/8, and 7/8 time signatures
- BPM range from 40 to 240 (from "chill lo-fi" to "drum and bass nightmare")
- Standard MIDI file export that actually works

### Circle of Fifths

Finally, a Circle of Fifths that doesn't look like it was made in MS Paint in 2003.

- **Musical Mode**: Classic notation for the theory nerds
- **Camelot Mode**: For DJs who think in numbers and letters
- Click any key to select it, then one-click to set it as your base or target key
- Inner ring for minor keys, outer ring for major keys
- Actually tells you useful stuff like harmonic relationships and mixing tips

### YouTube Analyzer

Paste a YouTube link, get the key, BPM, and time signature. That's it. That's the feature.

- Shows the video thumbnail so you know you got the right track
- Displays Camelot notation alongside musical notation (for the DJ homies)
- Confidence meters so you know how sure we are
- Half-time and double-time BPM because sometimes you need to know both
- One-click copy for all detected values

*Note: Currently uses simulated analysis. For production, you'd want to hook this up to a real audio analysis API.*

### It Looks Pretty Too

- Dark mode for late night sessions (galaxy vibes with that indigo-purple-pink gradient)
- Light mode for when you open your laptop at a coffee shop (soft rose aesthetic)
- Smooth-ass theme transitions that don't just snap between modes
- Sun/moon icon does a little spin when you toggle (because details matter)

## Try It

Just clone it and run it. Or click the deploy link if there is one.

## What's It Made With?

- Next.js 16 (app router gang)
- React 19 (living on the edge)
- Tailwind CSS 4 (utility classes go brrrr)
- Web Audio API (pure sine waves, chef's kiss)
- Homemade MIDI generator (no libraries, we built different)
- Glassmorphism everywhere (because 2024 called and we answered)

## How to Run This Locally

```bash
# Get the code
git clone https://github.com/yourusername/harmonic-studio.git
cd harmonic-studio

# Install the stuff
npm install

# Run it
npm run dev

# Now go to localhost:3000 and make some music
```

## How to Actually Use It

### Need to Pitch Shift Something?

1. Pick your current key/scale
2. Pick where you want it to go
3. It tells you the semitones ("+7" means pitch up 7, etc.)
4. Go do that in your DAW
5. Profit

### Making Chords

**The Normal Way:**

1. Pick a root note
2. Click a preset (Major, Minor, whatever)
3. Hit play to preview
4. Sounds good? Add it to your progression

**The "I'm Out of Ideas" Way:**

1. Click the lock button
2. Pick a key and scale
3. Spam that random button until something hits
4. All the random chords will stay in your scale so they won't sound completely cursed

### Building Progressions

1. Set how many bars you want (4, 8, or 16)
2. Set your BPM and time signature
3. Make some chords and add them
4. Click play to hear the whole thing
5. Export as MIDI
6. Open in your DAW
7. Add drums and bass
8. Become the next Skrillex (results may vary)

### Using the Circle of Fifths

1. Toggle between Musical and Camelot mode based on your vibe
2. Click any key to select it
3. Use the quick buttons to set it as your base or target key
4. Read the tips on the side if you forgot your music theory classes

### Analyzing a Track

1. Go to the Analyzer page (click the tab in the header)
2. Paste a YouTube URL
3. Wait for the magic
4. Copy whatever values you need
5. Go back to Composer and use them

## Why 432Hz Though?

Because some people think it sounds more "natural" or whatever. Honestly, it's just different from the standard 440Hz. You can change it in the code if you want:

```javascript
const A4 = 432; // Change to 440 if you're a conformist
```

The math is: `frequency = 432 * 2^(semitones/12)`

## Want to Add Stuff?

Hell yeah, PRs are welcome. Here's some ideas:

- [ ] Chord inversions (so you can make it sound fancy)
- [ ] 9th, 11th, 13th chords (jazz things)
- [ ] Different octaves for MIDI export
- [ ] Real YouTube audio analysis integration
- [ ] Keyboard shortcuts for power users
- [ ] Save/load progressions
- [ ] Whatever you think would be cool

Just fork it, make a branch, do your thing, and send a PR.

## Stuff That's Kinda Broken

- Mobile browsers can be weird with the audio (blame Apple)
- MIDI velocity is locked at 100 (all notes same volume)
- If you lock the scale to something with like 5 notes, random can get repetitive
- YouTube analyzer is simulated (needs real API for production)

None of it's dealbreaker stuff, just FYI.

## License

MIT - do whatever you want with it, just don't sue me if your track doesn't blow up.

## Credits

Made by someone who got tired of manually building chords at 4am and also wanted a Circle of Fifths that didn't look like garbage. Built with pure Web Audio API because sometimes you just want to understand how stuff actually works instead of npm installing 47 packages.

If this helped you make something cool, that's dope. Drop a star if you're feeling generous.

---

## Pro Tips

- The scale lock + random combo is actually fire for writer's block
- Export MIDI with placeholder chords, then humanize in your DAW
- Use the Circle of Fifths Camelot mode if you're a DJ trying to mix harmonically
- Light mode is genuinely nice if you're not in a cave
- 7/8 time signature is there if you want to confuse yourself
- The theme toggle animation is smooth af, try it a few times

---

**Made with caffeine and questionable life choices**

*P.S. - If you made it this far in the README, you're the real MVP*
