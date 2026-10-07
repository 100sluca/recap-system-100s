#!/usr/bin/env python3
"""Overlay du mode recap-system-100s, pour macOS et Linux (Windows a overlay.ps1, sans rien à installer).

Une petite fenêtre toujours au premier plan, en haut à gauche, comme l'overlay d'un salon vocal :
une ligne par projet en cours dans une session Claude Code, avec son nom, ses 5 barres de
fraîcheur et la prochaine commande. Elle lit les « présences » que le bandeau de chaque session
dépose dans ~/.claude/recap-system-100s/presence/, et se cache quand aucune session n'est en cours.

Glisser pour la déplacer. La croix d'une ligne masque ce projet jusqu'à sa prochaine session ; la
croix du titre ferme l'overlay. Clic droit : mode compact, opacité, réafficher les projets masqués,
quitter. Survoler une barre : son détail. Mêmes réglages que la version Windows :
~/.claude/recap-system-100s/overlay.json.

    python3 overlay.py                 la fenêtre
    python3 overlay.py --une-fois      la dessine, écrit sa taille, et se ferme (pour vérifier)

Seul besoin : Python 3 avec tkinter (macOS : python.org, ou `brew install python-tk` ;
Debian/Ubuntu : `sudo apt install python3-tk`).
"""

import json
import os
import socket
import sys
import time
import tkinter as tk
import tkinter.font as tkfont
from pathlib import Path

BASE = Path.home() / ".claude" / "recap-system-100s"
PRESENCES = BASE / "presence"
REGLAGES = BASE / "overlay.json"
FRAICHEUR_MS = 6 * 60_000

ORANGE, VERT, JAUNE, ROUGE = "#FF5F00", "#22C55E", "#EAB308", "#EF4444"
GRIS, PALE, FOND, FOND_BARRE, FILET = "#9CA3AF", "#6B7280", "#141414", "#3A3A3A", "#333333"


def maintenant_ms():
    return int(time.time() * 1000)


def cle(racine):
    return str(racine).replace("\\", "/").rstrip("/").lower()


def couleur(score):
    if score is None:
        return PALE
    return VERT if score >= 100 else JAUNE if score >= 60 else ROUGE


class Overlay:
    def __init__(self, une_fois=False):
        self.reg = {"left": 12, "top": 12, "compact": False, "opacite": 0.92, "masques": {}}
        try:
            lu = json.loads(REGLAGES.read_text(encoding="utf-8-sig"))
            for k in ("left", "top", "compact", "opacite"):
                if lu.get(k) is not None:
                    self.reg[k] = lu[k]
            self.reg["masques"] = {k: float(v) for k, v in (lu.get("masques") or {}).items()}
        except (OSError, ValueError, AttributeError):
            pass

        self.racine = tk.Tk()
        self.racine.title("recap-system-100s")
        self.racine.configure(bg=FOND)
        if sys.platform == "darwin":
            # Sans cadre, mais toujours capable de recevoir les clics (overrideredirect les perd sur macOS).
            self.racine.tk.call("::tk::unsupported::MacWindowStyle", "style", self.racine._w, "plain", "none")
        else:
            self.racine.overrideredirect(True)
        self.racine.attributes("-topmost", True)
        try:
            self.racine.attributes("-alpha", float(self.reg["opacite"]))
        except tk.TclError:
            pass
        # --une-fois se dessine à un endroit fixe, pour qu'on puisse le photographier.
        self.racine.geometry("+40+40" if une_fois else f"+{int(self.reg['left'])}+{int(self.reg['top'])}")

        famille = "Segoe UI" if sys.platform == "win32" else "Helvetica"
        self.f_nom = tkfont.Font(family=famille, size=13, weight="bold")
        self.f_titre = tkfont.nametofont("TkFixedFont").copy()
        self.f_titre.configure(size=9)
        self.f_mono = tkfont.nametofont("TkFixedFont").copy()
        self.f_mono.configure(size=11)
        self.f_croix = tkfont.Font(family=famille, size=13)

        self.cadre = tk.Frame(self.racine, bg=FOND, highlightthickness=1, highlightbackground=FILET, padx=12, pady=7)
        self.cadre.pack()
        self.derniere = None
        self.bulle = None
        self.depart = None
        self.menu = self.faire_menu()
        self.attacher(self.cadre)
        self.une_fois = une_fois

    # -- réglages ---------------------------------------------------------
    def enregistrer(self):
        BASE.mkdir(parents=True, exist_ok=True)
        REGLAGES.write_text(json.dumps(self.reg, indent=2), encoding="utf-8")

    # -- présences --------------------------------------------------------
    def lire_presences(self):
        par_projet = {}
        if PRESENCES.is_dir():
            for f in PRESENCES.glob("*.json"):
                try:
                    p = json.loads(f.read_text(encoding="utf-8-sig"))
                except (OSError, ValueError):
                    continue
                if p.get("fin") or not p.get("racine"):
                    continue
                if maintenant_ms() - float(p.get("maj") or 0) > FRAICHEUR_MS:
                    continue
                k = cle(p["racine"])
                if k not in par_projet or float(par_projet[k]["maj"]) < float(p["maj"]):
                    par_projet[k] = p
        visibles = []
        for k, p in par_projet.items():
            masque = self.reg["masques"].get(k)
            if not masque or float(p.get("debut") or 0) > masque:
                visibles.append(p)
        return sorted(visibles, key=lambda p: str(p.get("nom", "")).lower())

    # -- dessin -----------------------------------------------------------
    def attacher(self, w):
        """Glisser déplace la fenêtre ; clic droit ouvre le menu."""
        w.bind("<ButtonPress-1>", self.saisir)
        w.bind("<B1-Motion>", self.glisser)
        w.bind("<ButtonRelease-1>", self.lacher)
        for bouton in ("<Button-3>", "<Button-2>" if sys.platform == "darwin" else "<Button-3>", "<Control-Button-1>"):
            w.bind(bouton, self.ouvrir_menu)

    def croix(self, parent, aide, action):
        x = tk.Label(parent, text="×", fg=PALE, bg=FOND, font=self.f_croix, cursor="hand2", padx=4)
        x.bind("<Enter>", lambda e: (x.configure(fg=ORANGE), self.montrer_bulle(e, aide)))
        x.bind("<Leave>", lambda e: (x.configure(fg=PALE), self.cacher_bulle()))
        x.bind("<ButtonRelease-1>", lambda e: action())
        return x

    def montrer_bulle(self, e, texte):
        self.cacher_bulle()
        self.bulle = tk.Toplevel(self.racine)
        self.bulle.overrideredirect(True)
        self.bulle.attributes("-topmost", True)
        tk.Label(self.bulle, text=texte, bg="#262626", fg="#E5E7EB", justify="left", padx=6, pady=3,
                 font=self.f_titre).pack()
        self.bulle.geometry(f"+{e.x_root + 12}+{e.y_root + 14}")

    def cacher_bulle(self):
        if self.bulle is not None:
            self.bulle.destroy()
            self.bulle = None

    def barre(self, parent, piece):
        bloc = tk.Frame(parent, bg=FOND)
        tk.Label(bloc, text=str(piece.get("numero", "")), fg=GRIS, bg=FOND, font=self.f_titre).pack(side="left", padx=(0, 3))
        c = tk.Canvas(bloc, width=30, height=6, bg=FOND, highlightthickness=0)
        c.create_rectangle(0, 0, 30, 6, fill=FOND_BARRE, width=0)
        score = piece.get("score")
        if score is not None:
            c.create_rectangle(0, 0, max(4, 30 * float(score) / 100), 6, fill=couleur(score), width=0)
        c.pack(side="left")
        note = "pas encore le moment" if score is None else f"{score}/100"
        aide = f"{piece.get('numero')} · {piece.get('nom')} : {note}\n{piece.get('detail', '')}"
        for w in (bloc, c):
            w.bind("<Enter>", lambda e, a=aide: self.montrer_bulle(e, a))
            w.bind("<Leave>", lambda e: self.cacher_bulle())
            self.attacher(w)
        return bloc

    def construire(self, presences):
        self.cacher_bulle()
        for w in self.cadre.winfo_children():
            w.destroy()
        entete = tk.Frame(self.cadre, bg=FOND)
        entete.grid(row=0, column=0, columnspan=3, sticky="we")
        titre = tk.Label(entete, text="RECAP-SYSTEM-100S", fg=PALE, bg=FOND, font=self.f_titre)
        titre.pack(side="left")
        self.attacher(entete)
        self.attacher(titre)
        self.croix(entete, "Fermer l'overlay (il revient au prochain démarrage ;\n/recap-system-100s -overlay off l'éteint)",
                   self.racine.destroy).pack(side="right")
        ligne = 1
        for p in presences:
            nom = tk.Label(self.cadre, text=f"● {p.get('nom', '?')}", fg=ORANGE, bg=FOND, font=self.f_nom, anchor="w")
            nom.grid(row=ligne, column=0, sticky="w", padx=(0, 14), pady=(5, 0))
            self.attacher(nom)
            barres = tk.Frame(self.cadre, bg=FOND)
            barres.grid(row=ligne, column=1, sticky="w", pady=(5, 0))
            self.attacher(barres)
            for piece in p.get("pieces", []):
                self.barre(barres, piece).pack(side="left", padx=(0, 9))
            k = cle(p["racine"])
            self.croix(self.cadre, f"Masquer {p.get('nom')} (il revient à sa prochaine session)",
                       lambda k=k: self.masquer(k)).grid(row=ligne, column=2, sticky="e", pady=(5, 0))
            ligne += 1
            suite = p.get("suite")
            if not self.reg["compact"] and suite:
                s = tk.Label(self.cadre, text=f"→ {suite.get('action', '')}", fg=GRIS, bg=FOND, font=self.f_mono, anchor="w")
                s.grid(row=ligne, column=0, columnspan=3, sticky="w", padx=(14, 0), pady=(1, 3))
                self.attacher(s)
                ligne += 1

    def masquer(self, k):
        self.reg["masques"][k] = float(maintenant_ms())
        self.enregistrer()
        self.rafraichir(force=True)

    # -- glisser ----------------------------------------------------------
    def saisir(self, e):
        self.depart = (e.x_root - self.racine.winfo_x(), e.y_root - self.racine.winfo_y())

    def glisser(self, e):
        if self.depart:
            self.racine.geometry(f"+{e.x_root - self.depart[0]}+{e.y_root - self.depart[1]}")

    def lacher(self, _e):
        if self.depart:
            self.depart = None
            self.reg["left"], self.reg["top"] = self.racine.winfo_x(), self.racine.winfo_y()
            self.enregistrer()

    # -- menu -------------------------------------------------------------
    def faire_menu(self):
        m = tk.Menu(self.racine, tearoff=0)
        self.var_compact = tk.BooleanVar(value=bool(self.reg["compact"]))
        m.add_checkbutton(label="Mode compact", variable=self.var_compact, command=self.basculer_compact)
        m.add_separator()
        for o in (1.0, 0.8, 0.6):
            m.add_command(label=f"Opacité {int(o * 100)} %", command=lambda o=o: self.opacite(o))
        m.add_separator()
        m.add_command(label="Réafficher les projets masqués", command=self.reafficher)
        m.add_command(label="Quitter l'overlay", command=self.racine.destroy)
        return m

    def ouvrir_menu(self, e):
        self.menu.tk_popup(e.x_root, e.y_root)

    def basculer_compact(self):
        self.reg["compact"] = bool(self.var_compact.get())
        self.enregistrer()
        self.rafraichir(force=True)

    def opacite(self, o):
        self.reg["opacite"] = o
        try:
            self.racine.attributes("-alpha", o)
        except tk.TclError:
            pass
        self.enregistrer()

    def reafficher(self):
        self.reg["masques"] = {}
        self.enregistrer()
        self.rafraichir(force=True)

    # -- boucle -----------------------------------------------------------
    def rafraichir(self, force=False):
        presences = self.lire_presences()
        empreinte = ";".join(
            f"{p['racine']}|{p.get('nom')}|{','.join(str(x.get('score')) for x in p.get('pieces', []))}|{(p.get('suite') or {}).get('action')}"
            for p in presences)
        if force or empreinte != self.derniere:
            self.derniere = empreinte
            self.construire(presences)
        if presences:
            self.racine.deiconify()
            self.racine.attributes("-topmost", True)
        else:
            self.racine.withdraw()

    def tourner(self):
        self.rafraichir()
        if self.une_fois:
            self.racine.update()
            print(f"overlay : {len(self.lire_presences())} projet(s), {self.racine.winfo_width()}x{self.racine.winfo_height()}")
            self.racine.after(int(os.environ.get("RECAP_OVERLAY_DUREE_MS", "1500")), self.racine.destroy)
            return
        self.racine.after(3000, self.tourner)


def main():
    une_fois = "--une-fois" in sys.argv
    verrou = None
    if not une_fois:
        # Une seule fenêtre à la fois : le port local sert de verrou.
        verrou = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            verrou.bind(("127.0.0.1", 47_100))
        except OSError:
            return
    o = Overlay(une_fois=une_fois)
    o.racine.after(10, o.tourner)
    o.racine.mainloop()
    if verrou:
        verrou.close()


if __name__ == "__main__":
    main()
