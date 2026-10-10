# Adriatic Steel League (ASL)

Darts (steel tip) liga: tablice, grupe, ždrijeb, statistike i profili igrača. Sučelje i komentari u kodu su na hrvatskom (`<html lang="hr">`), pa nove tekstove i komentare piši na hrvatskom.

## Struktura

Tri samostalne stranice, svaka s inline `<style>` i `<script>`; **nema build koraka, frameworka ni testova**.

- `index.html` – javna stranica (glavna navigacija TABLICE, NAJBOLJI U LIGI, ŽENSKA LIGA, AVG LIGE, ŽDRIJEB s prekidačem gornji/donji, profili igrača, upload avatara). Ime mora ostati malim slovima.
- `index-admin.html` – prijava + admin/operater panel (grupe, ždrijeb, AVG lige, igrači, zahtjevi za slike).
- `group-detail.html` – unos rezultata jedne grupe, otvara se kao `?group=ID` (+ `&league=...` za AVG/žensku ligu).
- `functions/` je prazan (samo komentar); `404.html`, `robots.txt`, `sitemap.xml` su statični.

Firebase Hosting služi **cijeli korijen** (`"public": "."`), pa sve u korijenu što nije u `hosting.ignore` postaje javno. Ne dodavaj tajne ni privatne datoteke u korijen.

## Podaci (Firestore, bez emulatora; stranice uvijek koriste živi projekt)

- `config/active-season`, `config/bracket-config`. Polja `trenutnoKolo`, `trenutnoKoloAvg` i `trenutnoKoloZenska` (koja kola su javno vidljiva, nizovi npr. `[1,2,3]`) uređuju se **samo ručno u Firebase konzoli** (superadmin); admin panel nema kontrole za njih.
- `seasons/{sezona}/groups/{slovo}/players|matches`, `seasons/{sezona}/bracket|lower-bracket/{matchId}`
- AVG lige: `avg-leagues/{sezona}/{leagueId}/{groupId}`; ženska liga: `women-league/{sezona}/groups/{groupId}` (logički ključ lige je `'zenska'`)
- `players/{slug}` (registar, `photoURL`), `photoRequests/{slug}`, `users/{uid}` (`role`: `admin` ili operater s popisom dodijeljenih grupa)
- Sezone: `sezona-1`, `sezona-2`, `sezona-3`; aktivna dolazi iz `config/active-season` (rezervna vrijednost `DEFAULT_ACTIVE_SEASON_ID` u kodu).
- Ždrijeb: gornji `R64…F`, donji `LR64…LF`; parovi iz `R64_DRAW`, fiksno 16 grupa A–P.
- Firestore/Storage pravila i CORS **nisu u repou** nego u Firebase konzoli. Kad treba promjena, napiši točan blok pravila pa korisnik sam objavi.
- Na localhostu App Check koristi debug token (blok u `index.html` iznad `initializeAppCheck`); admin stranica na localhostu **piše u produkciju**.

## Dupliciran kod: mijenjaj na svim stranicama

Namjerno nema zajedničke datoteke. Ako mijenjaš nešto od ovoga, provjeri ostale stranice (index / admin / group = `group-detail`):

- sve tri: `leagueGroupsPath`, `loadBracketConfig`, `resolveActiveSeasonId`, `showToast`, `DEFAULT_ACTIVE_SEASON_ID`, `AVG_RESERVED_DOC_IDS`
- index + admin: `R64_DRAW`, `ROUND_IDS`, `LROUND_IDS`, `LOWER_LAYOUTS`, `getLowerLayout`, `AVG_LEAGUE_LABELS`, `SEASON_LABELS`, `generateAvgSchedule`, `getPlayoffLegs`, `roundKeyFromMatchId`, `getVisibleRounds`, `resolveName`, `slugify`, `formatMatchTimestamp`, `compressImageForUpload`
- index + group: `computeStandings`, `formHtml`, `generateSchedule` (Berger), `getGroupPhaseLegs`, CSS tablice grupe (`table`, `.table-wrap`, `.form-badge`; podnožje `.table-footer-brand` / `.schedule-footer` ima samo index; raspored nema vlastiti okvir, a njegovo podnožje ide do rubova akordeona)
- admin + group: `esc`, `groupIdToLetter`
- sve tri: CSS blok `-- INTERAKCIJE --` na kraju `<style>` (isti prijelazi, pritisak `scale`, fokus i onemogućeno stanje na svakom `button`, `[onclick]` i `a[href]`), `--ease-glide`, traka `.sub-tabs` + `.sub-tabs-line` i `placeIndicator()` (index, group i admin; admin dodaje vlastitu `.admin-tabs` s istom crtom)

## Dizajn

- Tamna plava tema, pozadina `images/background.webp` + tamni overlay. Font **Lexend** (400/600/700/800), ikone **Font Awesome 6.5.1** (oba s CDN-a).
- Boje i oblik samo preko varijabli u `:root` (`--text`, `--muted`, `--panel`, `--panel-2`, `--header`, `--line`, `--shadow`, `--radius: 18px`, `--table-head`). Admin i group-detail dodaju `--accent`, `--success`, `--warning`, `--danger`. Nove boje ne hardkodiraj ako varijabla postoji.
- Ponavljajuće komponente: `.table-wrap` + `thead th`, akordeoni (`.accordion-item.open`), popup (`.match-popup-overlay` / `.match-popup`, kartica `.mpc-*`), `.toast`, `.empty-state` / `.error-state` / `.loading-state`, ždrijeb (`.bracket-wrap`). Prije nove komponente potraži postojeću.
- Kontrole u `index.html` (pretraga `.player-search-box`, prekidač sezone `.seg-switch`, podtabovi `.sub-tabs`, navigacija `.main-nav`) nisu pilule: dijele CSS sekciju `-- KONTROLE --` sa staklenom trakom (`--panel`, `--line`, `--radius`) i visinom `--bar-h` (52 px, 48 na 768, 46 na 480). Aktivno označava bijeli sjaj: u navigaciji klizna crta `.nav-indicator`, u prekidačima ispunjena klizna pločica `.seg-thumb` (oboje preko `placeIndicator()`: položaj se zadaje rubovima `left`/`right` pa klizi elastično, `--ind-inset` sužava crtu, `--ease-glide` je zajednički easing; crte blijede prema rubovima gradijentom), a u pretrazi se sjaj pali na fokusu. Navigacija je na mobitelu fiksna traka pri dnu zaslona (ikona + natpis, 5 stavki), od 769 px običan red ispod pretrage; zato `.container` mora imati animaciju s `backwards`, ne `both` (trajni transform bi razbio `position: fixed`). Prekidač sezone je toggle (ne padajući izbornik) s oznakama `S2 | S3`, a desno poravnata oznaka "Arhiva sezona" stoji iznad njega (`.season-toggle`); `renderGlobalSeasonToggle()` gradi DOM samo kad se promijeni skup sezona. Svi tab-prebacivači na sve tri stranice su iste trake s klizećom crtom: `.sub-tabs` (Tablica | Raspored u akordeonima `switchGroupTab()`, AVG podtabovi na javnoj stranici i u adminu, tabovi profila igrača `#profile-tabs` + sezonska traka `#profile-subtabs`, `group-detail.html`) i `.admin-tabs` (glavni admin tabovi, klize na uskim ekranima). Novi gumb ne dobiva vlastiti `transition`: blok `-- INTERAKCIJE --` ga nadjačava (inline `transition` bi ga omeo). Ždrijeb je jedan panel (`#tab-zdrijeb`) s podtabovima Gornji | Donji (`switchBracketView()`); podtabovi su vodoravna traka `.sub-tabs` s klizećom crtom `.sub-tabs-line` (`positionSubTabsLine()`). Profil igrača ima dvije razine tabova: glavna `#profile-tabs` (Sveukupno | Sezone | AVG | Ženska liga; tabove koje igrač nema ne prikazuje, `switchProfileTab()`) i ispod nje `#profile-subtabs` sa sezonama odabranog taba (`switchProfileSub()`; vidljiva je uvijek kad tab ima sezone, i kad je samo jedna; svaki tab pamti zadnju sezonu, zadana je najnovija koju igrač ima, pa nova sezona AVG lige ne traži izmjenu koda). AVG lige i Ženska liga imaju vlastito brojanje sezona: podaci su pod ID-jem glavne sezone, a oznaku daje `leagueSeasonLabel(ligaId, sezonaId)` od prve sezone te lige (`AVG_FIRST_SEASON = 'sezona-2'`, `ZENSKA_FIRST_SEASON = 'sezona-3'`; npr. `sezona-3` je AVG Sezona 2, a Ženska liga Sezona 1). Profil se pri prebacivanju iscrtava ispočetka, pa `renderPlayerProfile({main, sub})` nove crte postavlja na staro mjesto i odande ih pušta da kliznu. Statistika profila igrača su tri prstena (AVG, First 9, 180s) uvijek vidljiva u `.player-stats-card` plus red sporednih (PTS, W/D/L, Legs, Best Leg, Best CO): klik na prsten (`switchProfileChart(uid, metrika)`) mijenja samo graf ispod, dok su neodabrani prstenovi prigušeni, a bijela crta klizi do odabranog. Graf se iscrtava iz `profileCharts[uid]` (točke sve tri metrike jedne sekcije), a detalj meča u profilu otvara se glatko (`.pmd-in`) i ima ravnu statistiku bez pozadinskih kutija. Novu kontrolu gradi iz tih pravila.
- Mobilni prikaz je glavni (breakpointi 768 / 640 / 480 px). Provjeri 375, 768 i 1280 px.
- Skill `frontend-design` (ako je instaliran) koristi samo za nove sekcije ili stranice, i uvijek napiši: zadrži Lexend, Font Awesome i postojeće varijable iz `:root`, ne mijenjaj postojeće dijelove. Sam od sebe vuče prema potpuno novom izgledu.

## Navigacija po velikim datotekama

Sekcije u svim `<script>` i `<style>` blokovima imaju komentar-naslov: JS `// -- NAZIV --`, CSS `/* -- NAZIV -- */`. Pregled: `grep -n -E '^\s*(//|/\*) -- ' index.html`. Upućuj na sekcije po imenu, ne po broju retka (brojevi se stalno pomiču). Novu sekciju označi istim stilom.

## Rad

- Provjera: posluži stranice lokalno (npr. `python -m http.server 5173`), otvori u Browser pane-u, pogledaj konzolu i snimke na 375 / 768 / 1280 px. Privremeni `.claude/launch.json` obriši nakon testa. Lighthouse (Chrome DevTools MCP, ako je dodan) ne radi na `file://`, stranica mora biti poslužena preko localhosta.
- Ne commitaj i ne deployaj; korisnik to radi sam.
- Radije kratka dupla funkcija nego nova zajednička datoteka; jednokratne alate i migracije ukloni nakon upotrebe.
