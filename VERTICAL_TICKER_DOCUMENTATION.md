# Composant VerticalTicker

Un composant React autonome pour afficher des messages en boucle avec animation verticale.

## 📋 Caractéristiques

- ✅ Affiche des messages qui changent automatiquement
- ✅ Animation verticale (slideInFromTop) à chaque changement
- ✅ Label fixe à gauche
- ✅ Hauteur fixe 40px
- ✅ Fond rouge foncé avec texte blanc
- ✅ Label bleu à gauche
- ✅ Styles centralisés avec objets COLORS et STYLES
- ✅ Animation CSS dans `<style jsx global>`
- ✅ Gère automatiquement le cleanup du setInterval

## 🚀 Installation

Le composant est situé à :
```
resources/js/Components/VerticalTicker.jsx
```

## 💻 Utilisation basique

```jsx
import VerticalTicker from "@/Components/VerticalTicker";

const messages = [
    { id: 1, text: "Premier message" },
    { id: 2, text: "Deuxième message" },
    { id: 3, text: "Troisième message" },
];

export default function Dashboard() {
    return (
        <div>
            <VerticalTicker messages={messages} />
            {/* Votre contenu */}
        </div>
    );
}
```

## 🎯 Props

### `messages` (Array, requis)
Tableau de messages à afficher. Chaque objet doit avoir :
- `id` : identifiant unique
- `text` : texte du message

```jsx
const messages = [
    { id: 1, text: "Message 1" },
    { id: 2, text: "Message 2" },
];
```

### `interval` (Number, optionnel)
Intervalle de changement en millisecondes.
- Défaut: `4000` (4 secondes)

```jsx
<VerticalTicker messages={messages} interval={3000} />
```

### `label` (String, optionnel)
Texte affiché dans le label à gauche.
- Défaut: `"Flash Infos"`

```jsx
<VerticalTicker messages={messages} label="Annonces" />
```

## 🎨 Personnalisation

### Modifier les couleurs

Éditez l'objet `COLORS` dans le composant :

```jsx
const COLORS = {
    labelBg: "#1e40af",    // Bleu label
    tickerBg: "#7f1d1d",   // Rouge foncé fond
    text: "#ffffff",       // Blanc texte
};
```

### Modifier les styles

Éditez l'objet `STYLES` pour ajuster :
- Padding
- Hauteur
- Police
- Bordures

```jsx
const STYLES = {
    container: {
        height: "40px",           // Hauteur fixe
        backgroundColor: COLORS.tickerBg,
        padding: "0 16px",
        // ... autres propriétés
    },
};
```

## 📐 Exemple complet avec mainLayout

```jsx
import MainLayout from "@/Layouts/MainLayout";
import VerticalTicker from "@/Components/VerticalTicker";

export default function Dashboard(props) {
    const messages = [
        { id: 1, text: "✝️ Messe dominicale à 10h30" },
        { id: 2, text: "📢 Inscription baptême : délai 15 mars" },
        { id: 3, text: "🙏 Prière communautaire vendredi 19h" },
    ];

    return (
        <MainLayout>
            <VerticalTicker messages={messages} />
            
            {/* Votre contenu du dashboard */}
            <div className="content">
                {/* ... */}
            </div>
        </MainLayout>
    );
}
```

## 🎬 Animations

L'animation `slideInFromTop` fait :
1. Apparaître le texte depuis le haut (-10px)
2. Transition d'opacité de 0 à 1
3. Déplacement vers la position finale (0px)
4. Durée : 0.5 secondes

## 🔧 Comportement

1. Le composant affiche le premier message au chargement
2. Toutes les 4 secondes (configurable), le message change
3. L'animation slideInFromTop se déclenche
4. Les messages sont affichés en boucle infinie
5. Le setInterval est nettoyé au démontage du composant

## ⚠️ Notes importantes

- Si le tableau `messages` est vide, le composant n'affiche rien
- Les IDs des messages doivent être uniques
- L'animation utilise CSS global pour les keyframes
- Le composant est complètement autonome et réutilisable

## 📝 Exemple avec useState dynamique

```jsx
import { useState } from "react";
import VerticalTicker from "@/Components/VerticalTicker";

export default function DynamicDashboard() {
    const [messages, setMessages] = useState([
        { id: 1, text: "Message initial" },
    ]);

    const addMessage = (text) => {
        setMessages([...messages, { id: Date.now(), text }]);
    };

    return (
        <div>
            <VerticalTicker messages={messages} interval={5000} label="Actualités" />
            <button onClick={() => addMessage("Nouveau message!")}>
                Ajouter message
            </button>
        </div>
    );
}
```

## 🎯 Cas d'utilisation

- 📢 Barre d'annonces dans les dashboards
- 🔔 Notifications système tournantes
- 💬 Messages importants à afficher
- ⚠️ Alertes paroissiales
- 📰 Actualités/Flash infos

---

**Version** : 1.0  
**Dernière mise à jour** : Mars 2026
