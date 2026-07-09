<div align="center">

# 🥊 Neon Brawl

**A retro arcade fighting game — built in a single HTML file. No engine, no build step, no dependencies.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4-ff2d6f?style=flat-square)
![No Dependencies](https://img.shields.io/badge/dependencies-none-2de0ff?style=flat-square)
![License: MIT](https://img.shields.io/badge/license-MIT-ffd166?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

</div>

---

## 🎮 About

**Neon Brawl** is a 2D arcade-style fighting game rendered entirely on an HTML `<canvas>`, with zero image assets, zero libraries, and zero build tools. Open the file, and you're fighting.

Two neon-lit fighters — **Crimson** and **Cyan** — throw punches and kicks, block, and knock each other around a synthwave-style stage. Best of 3 rounds, 60-second clock, straightforward arcade rules.

## ✨ Features

- 🕹️ **1 Player vs CPU** or **2 Player local** modes
- 🥋 Punch, kick, block, jump, and movement with proper hit-stun and knockback
- 🛡️ Blocking reduces damage instead of negating it (chip damage), like classic fighters
- ⏱️ Best-of-3 rounds with a 60-second round timer
- 🎨 Custom neon/synthwave visual style — no sprite sheets, everything is drawn in code
- 📦 **Single HTML file** — drop it anywhere, open it in any browser, done

## 🚀 Getting Started

No installation needed.

1. Clone or download this repo
2. Open `fighting-game.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. Pick a mode and fight

```bash
git clone https://github.com/yourusername/neon-brawl-fighting-game.git
cd neon-brawl-fighting-game
# then just open fighting-game.html in your browser
```

Or, if you have VS Code with the **Live Server** extension: right-click `fighting-game.html` → **Open with Live Server**.

## 🕹️ Controls

| Action | Player 1 — Crimson | Player 2 — Cyan |
|---|---|---|
| Move | `A` / `D` | `←` / `→` |
| Jump | `W` | `↑` |
| Block (hold) | `S` | `↓` |
| Punch | `F` | `K` |
| Kick | `G` | `L` |
| Pause | `P` | `P` |

## 🏆 Rules

- Each match is **best of 3 rounds**
- Each round lasts **60 seconds**
- A round ends when a fighter's health hits zero (**K.O.**) or the clock runs out (highest health wins)
- First fighter to win **2 rounds** takes the match

## 🛠️ Built With

- **HTML5 Canvas** — all rendering, no images
- **Vanilla JavaScript** — game loop, physics, hit detection, simple AI
- **CSS3** — HUD, menus, and the neon arcade-cabinet look

No frameworks, no npm packages, no build pipeline — just open and play.

## 📸 Preview

> _Add a screenshot or GIF of gameplay here — drag one into this section on GitHub and it'll render automatically._

## 🗺️ Possible Future Additions

- [ ] More attack types (special moves, combos)
- [ ] Additional character skins/colors
- [ ] Sound effects and music
- [ ] Online multiplayer
- [ ] Mobile touch controls

## 🤝 Contributing

Contributions, bug reports, and ideas are welcome — open an issue or submit a pull request.

## 📄 License

Released under the [MIT License](LICENSE) — free to use, modify, and share.

---

<div align="center">

Made for fun with 🥊 + 💻

</div>
