# 90 Day Run

De digitale cursus Sales Foundations 90: 13 weken met trainingen, opdrachten, dagelijkse gewoonte, fiches en meetmomenten. Iedere deelnemer logt in en vult zijn eigen boek in. Deelnemers zien niets van elkaar. De beheerder (jij) kan iedereen bekijken, alleen lezen.

## Hoe de privacy werkt

- Er is geen open registratie. Jij maakt een deelnemer aan en stuurt een persoonlijke uitnodigingslink (14 dagen geldig, één keer te gebruiken). Daarmee kiest de deelnemer een eigen wachtwoord.
- Een deelnemer kan alleen zijn eigen gegevens lezen en schrijven. De API van een deelnemer heeft geen veld waarmee je een ander kunt opgeven: de identiteit komt uitsluitend uit de sessiecookie.
- Alleen het beheerdersaccount kan `/api/admin/*` gebruiken. Daar zie je alle deelnemers, hun voortgang en hun ingevulde boek.
- De deelnemer ziet op het inlogscherm en onder Voortgang dat de begeleider meekijkt.
- Wachtwoorden zijn gehasht met bcrypt. De sessie zit in een HttpOnly-cookie (Secure in productie). Uitschakelen of een wachtwoordwijziging beëindigt andere sessies direct. Inloggen is beperkt tot 8 mislukte pogingen per 15 minuten. Schrijfacties vragen een extra header als CSRF-slot, en er staat een strikte Content-Security-Policy.

## Online zetten (ongeveer 15 minuten)

### 1. Database: MongoDB Atlas (gratis)

1. Maak een account op mongodb.com/atlas en een gratis M0-cluster.
2. Database Access: maak een gebruiker met wachtwoord.
3. Network Access: voeg `0.0.0.0/0` toe (Render heeft geen vast IP-adres).
4. Connect, Drivers: kopieer de verbindingsstring (`mongodb+srv://...`). Vul gebruiker en wachtwoord in.

### 2. Server: Render

1. Op render.com: New, Blueprint, kies deze repo. Render leest `render.yaml`.
2. Vul de drie gevraagde waarden in:
   - `MONGO_URL`: de Atlas-verbindingsstring
   - `ADMIN_EMAIL`: jouw e-mailadres
   - `ADMIN_PASSWORD`: een eigen wachtwoord, minstens 10 tekens
3. `JWT_SECRET` wordt door Render zelf gegenereerd.
4. Na de eerste deploy log je in op de `onrender.com`-link met je beheerdersaccount. Het wachtwoord wijzig je daarna onder Voortgang, Account.

Het gratis Render-plan gaat na een tijd stilstand slapen. De eerste aanvraag daarna duurt dan even. Voor een groep die dagelijks inlogt is het betaalde plan prettiger.

### 3. Deelnemers uitnodigen

Ga naar **Deelnemers**, vul naam en e-mailadres in en kopieer de uitnodigingslink. Stuur die persoonlijk door.  Zonder geldige link kan niemand een account maken.

## Lokaal draaien

Zonder database, om snel te proberen (gegevens verdwijnen bij herstart):

```bash
cd backend
pip install -r requirements-dev.txt
USE_MOCK_DB=1 ADMIN_EMAIL=jij@example.com ADMIN_PASSWORD=een-lang-wachtwoord uvicorn app.main:app --reload
```

Open http://localhost:8000. Met een echte MongoDB:

```bash
cp .env.example .env   # vul ADMIN_EMAIL en ADMIN_PASSWORD in
docker compose up --build
```

## Tests

```bash
cd backend && python -m pytest -q tests     # API, privacy en beveiliging
tools/run_e2e.sh                            # browsertest met Playwright (login, isolatie, beheerdersweergave)
```

## Weergave

De app heeft drie weergaven, afgestemd op de presentaties: donker (standaard), licht en rood. Je kiest met de drie bolletjes rechtsboven; de keuze wordt per toestel onthouden. De lettertypen (Anton, Public Sans, IBM Plex Mono) staan in de app zelf, dus er worden geen externe diensten geladen.

## Installeren op je telefoon

De app is installeerbaar (PWA). In Chrome op Android: menu, **App installeren** of **Toevoegen aan startscherm**. Op iPhone in Safari: Deel, **Zet op beginscherm**. De iconen maak je opnieuw met `python3 tools/make_icons.py` en een build met `python3 tools/build.py`. De service worker bewaart niets in de cache, dus persoonlijke gegevens blijven alleen op de server.

## Opbouw

```
backend/    FastAPI + MongoDB (pymongo)
frontend/   statische app (vanilla JS), wordt door FastAPI geserveerd
tools/      bouwscript voor de frontend + bron van de cursusinhoud
```

`frontend/` is gegenereerd uit `tools/src/app.html`, `tools/src/course.json`, `tools/state.js` en `tools/tail.js` met `python3 tools/build.py`. Pas de cursusinhoud aan in `tools/src/course.json` en bouw opnieuw.

## Omgevingsvariabelen

| Variabele | Verplicht | Uitleg |
|---|---|---|
| `APP_ENV` | ja in productie | `production` zet Secure-cookies en HSTS aan |
| `MONGO_URL` | ja | verbindingsstring van MongoDB |
| `JWT_SECRET` | ja in productie | minstens 32 tekens |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | ja bij eerste start | maakt het beheerdersaccount aan |
| `DB_NAME` | nee | standaard `run90` |
| `SESSION_DAYS`, `INVITE_DAYS` | nee | standaard 14 |
