const functions = require("firebase-functions");
const express = require("express");
const path = require("path");
const prerender = require("prerender-node");

// ── PRERENDER TOKEN ──
// Token iz Prerender.io dashboarda (Security and Access izbornik).
// Postavlja se kao env varijabla prije deploya - vidi UPUTE.md.
const PRERENDER_TOKEN = process.env.PRERENDER_TOKEN || "";
if (!PRERENDER_TOKEN) {
  console.warn(
    "PRERENDER_TOKEN nije postavljen! Botovi neće dobiti prerenderirani sadržaj dok se ne postavi (vidi UPUTE.md)."
  );
}

const app = express();

// KAKO OVO RADI (prema Prerender.io dokumentaciji):
// 1. Svaki zahtjev prvo prolazi kroz prerender middleware.
// 2. Middleware provjeri User-Agent. Ako NIJE bot -> odmah zove next() i
//    zahtjev ide dalje kroz Express pipeline nedirano (korisnik ne primijeti
//    da Prerender uopće postoji).
// 3. Ako JEST bot -> middleware sam presretne zahtjev, pozove Prerender.io
//    servis (headless browser render + cache), i vrati gotov HTML izravno.
//    Express pipeline ispod se u tom slučaju NE izvršava.
app.use(prerender.set("prerenderToken", PRERENDER_TOKEN));

// Za sve zahtjeve koje prerender NIJE presreo (= pravi korisnici), Express
// servira statične fajlove iz "public" foldera - to je kopija tvog
// postojećeg Hosting sadržaja (index.html, images/, itd.), sinkronizirana
// pri svakom deployu (vidi UPUTE.md, korak "kopiraj public sadržaj").
// express.static prema defaultu poslužuje "index.html" automatski za "/".
app.use(express.static(path.join(__dirname, "public")));

// Fallback ako iz nekog razloga static middleware ne nađe fajl - vrati
// index.html eksplicitno umjesto tihog 404 (npr. ako netko ode na /neka-ruta
// koja ne postoji, radije prikaži glavnu stranicu nego prazan error).
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

exports.renderBot = functions.https.onRequest(app);

