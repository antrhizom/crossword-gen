# Kreuzworträtsel-Generator 🎯

Ein interaktiver Kreuzworträtsel-Generator, mit dem du eigene Kreuzworträtsel erstellen und per Link teilen kannst!

## ✨ Features

- 🎨 **Wörter eingeben**: Beliebig viele Wörter mit Hinweisen hinzufügen
- 🧩 **Automatische Generierung**: Intelligenter Algorithmus platziert Wörter und verknüpft sie
- 🔗 **Link-Sharing**: Erstelle einen teilbaren Link für dein Rätsel
- ✏️ **Interaktives Lösen**: Rätsel direkt im Browser ausfüllen
- ✅ **Lösung prüfen**: Sofortiges Feedback zu richtigen/falschen Antworten
- 📱 **Responsive Design**: Funktioniert auf Desktop und Mobilgeräten

## 🚀 Installation & Start

### Voraussetzungen
- Node.js (Version 18 oder höher)
- npm oder yarn

### Lokale Installation

1. Repository klonen oder ZIP herunterladen
```bash
git clone https://github.com/dein-username/kreuzwortraetsel-generator.git
cd kreuzwortraetsel-generator
```

2. Dependencies installieren
```bash
npm install
```

3. Entwicklungsserver starten
```bash
npm run dev
```

4. Öffne [http://localhost:5173](http://localhost:5173) im Browser

### Production Build

```bash
npm run build
```

Die fertige App befindet sich dann im `dist/` Ordner.

## 🌐 Deployment

### Vercel (Empfohlen)

1. Erstelle einen Account auf [Vercel](https://vercel.com)
2. Installiere Vercel CLI: `npm i -g vercel`
3. Im Projektordner ausführen: `vercel`
4. Folge den Anweisungen

Oder direkt über die Vercel-Website:
- Repository auf GitHub pushen
- "New Project" auf Vercel
- GitHub Repository verbinden
- Deploy!

### Netlify

1. Build durchführen: `npm run build`
2. `dist/` Ordner auf [Netlify](https://www.netlify.com) hochladen
   
Oder über Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

1. In `vite.config.js` die `base` Option anpassen:
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/kreuzwortraetsel-generator/', // Dein Repository-Name
})
```

2. Build erstellen:
```bash
npm run build
```

3. GitHub Actions für automatisches Deployment:

Erstelle `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

4. In GitHub Repository Settings:
   - "Pages" → Source: "GitHub Actions"

## 📖 Verwendung

1. **Wörter eingeben**: Gib mindestens 2 Wörter mit Hinweisen ein
2. **Rätsel erstellen**: Klicke auf "Kreuzworträtsel erstellen"
3. **Lösen**: Fülle die Buchstaben in die Felder ein
4. **Prüfen**: Klicke auf "Prüfen" um deine Lösung zu überprüfen
5. **Teilen**: Klicke auf "Teilen" um einen Link zu generieren

## 🛠️ Technologien

- React 18
- Vite
- Tailwind CSS
- Lucide React (Icons)

## 📝 Lizenz

MIT License - Du kannst den Code frei verwenden, modifizieren und teilen!

## 🤝 Beitragen

Pull Requests sind willkommen! Für größere Änderungen öffne bitte zuerst ein Issue.

## ⭐ Support

Wenn dir das Projekt gefällt, gib ihm einen Stern auf GitHub!

---

Made with ❤️ für alle Rätsel-Fans
