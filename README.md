# 🎵 Chord Generator & Pitch Calculator

A music theory tool that actually doesn’t suck. Calculate pitch shifts, generate chords, build progressions, and export to MIDI—all while vibing at A=432Hz because we’re fancy like that.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)
![Vibes](https://img.shields.io/badge/vibes-immaculate-ff69b4.svg)

## ✨ What’s This Thing Do?

### 🎹 Pitch & Scale Calculator

Ever had a fire sample in C but your beat’s in F#? This tells you exactly how many semitones to pitch that shit. No more trial and error, no more “does +7 sound right?” Just facts.

Works with 14 different scales because sometimes you’re feeling Dorian, sometimes you’re feeling Phrygian, and sometimes you just want that Blues scale energy.

### 🎸 Chord Generator

Look, we’ve all been there. Staring at the piano roll at 3am, trying to make a chord that doesn’t sound like ass. This thing helps.

- 12 chord presets (Major, Minor, the weird ones, all of it)
- Click notes manually if you’re feeling creative
- **Random button** for when your brain is fried and you need inspiration
- **Scale lock** so your random chords actually stay in key (revolutionary, I know)
- Play button that goes “beep boop” so you can hear if it slaps

### 🎼 Progression Builder

Build entire chord progressions up to 16 bars. Set your BPM, pick your time signature (yes, even 7/8 if you’re one of *those* people), and export the whole thing as MIDI.

No more playing each chord into your DAW one by one like a caveman. Just click, export, drag into Ableton, done.

### 🌓 It Looks Pretty Too

- Dark mode for late night sessions (galaxy vibes)
- Light mode for when you open your laptop at a coffee shop (aesthetic™)
- Everything’s smooth as hell, no janky animations

## 🚀 Try It

[**Click here to mess around with it →**](#) *(Add your link)*

## 🛠️ What’s It Made With?

- React (because of course)
- Tailwind (utility classes go brrrr)
- Web Audio API (pure sine waves, chef’s kiss)
- Homemade MIDI generator (no libraries, we built different)

## 📦 How to Run This Locally

```bash
# Get the code
git clone https://github.com/yourusername/chord-generator.git
cd chord-generator

# Install the stuff
npm install

# Run it
npm start

# Now go to localhost:3000 and make some music
```

## 🎯 How to Actually Use It

### Need to Pitch Shift Something?

1. Pick your current key/scale
1. Pick where you want it to go
1. It tells you the semitones (”+7” means pitch up 7, etc.)
1. Go do that in your DAW
1. Profit

### Making Chords

**The Normal Way:**

1. Pick a root note
1. Click a preset (Major, Minor, whatever)
1. Hit play to preview
1. Sounds good? Add it to your progression

**The “I’m Out of Ideas” Way:**

1. Click the lock button
1. Pick a key and scale
1. Spam that random button until something hits
1. All the random chords will stay in your scale so they won’t sound completely cursed

### Building Progressions

1. Set how many bars you want (4, 8, or 16)
1. Set your BPM and time signature
1. Make some chords and add them
1. Click play to hear the whole thing
1. Export as MIDI
1. Open in your DAW
1. Add drums and bass
1. Become the next Skrillex (results may vary)

## 🎼 Why 432Hz Though?

Because some people think it sounds more “natural” or whatever. Honestly, it’s just different from the standard 440Hz. You can change it in the code if you want:

```javascript
const A4 = 432; // Change to 440 if you're a conformist
```

The math is: `frequency = 432 × 2^(semitones/12)`

## 🤝 Want to Add Stuff?

Hell yeah, PRs are welcome. Here’s some ideas:

- [ ] Chord inversions (so you can make it sound fancy)
- [ ] 9th, 11th, 13th chords (jazz things)
- [ ] Different octaves for MIDI export
- [ ] Make the random button even more chaotic
- [ ] Whatever you think would be cool

Just fork it, make a branch, do your thing, and send a PR.

## 🐛 Stuff That’s Kinda Broken

- Mobile browsers can be weird with the audio (blame Apple)
- MIDI velocity is locked at 100 (all notes same volume)
- If you lock the scale to something with like 5 notes, random can get repetitive

None of it’s dealbreaker stuff, just FYI.

## 📝 License

MIT - do whatever you want with it, just don’t sue me if your track doesn’t blow up.

## 🙏 Credits

Made by someone who got tired of manually building chords at 4am. Built with pure Web Audio API because sometimes you just want to understand how shit actually works instead of npm installing 47 packages.

If this helped you make something cool, that’s dope. Drop a star ⭐ if you’re feeling generous.

## 📧 Hit Me Up

Got questions? Found a bug? Just want to show me what you made with this?

**[Your Name]** - [@yourhandle](https://twitter.com/airiharuki0)

Project: <https://github.com/airiharuki/musictheory-vibecoded>

-----

## 💡 Pro Tips

- The scale lock + random combo is actually fire for writer’s block
- Export MIDI with placeholder chords, then humanize in your DAW
- Light mode is genuinely nice if you’re not in a cave
- 7/8 time signature is there if you want to confuse yourself

-----

**Made with ❤️, caffeine, and questionable life choices**

*P.S. - If you made it this far in the README, you’re the real MVP*
