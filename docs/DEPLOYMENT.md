# Testing, publishing and hosting

## 1. How to test it

### Automated (do this first)
```bash
npm ci
npm test         # dataset adds up to official totals, model behaviour, share-link round-trip
npm run build    # also type-checks
```
The same tests run in GitHub Actions on every push and pull request.

### In the browser (development)
```bash
npm run dev
```
Open http://localhost:5173 and try: pick each scenario chip; drag a few sliders; open "About" on a line to see its
source link; toggle "Use cesses & surcharges"; copy the address bar into a new tab (your scenario should reload).
Check that the starting deficit shows 4.31% (the Budget's 4.3%) and that **Reset to budget** brings it back.

### On your phone
- Same Wi-Fi: `npm run dev -- --host` and open the printed `Network:` URL on your phone.
- Installing and offline need HTTPS or localhost, so test those on the deployed site, or locally with
  `npm run build && npm run preview`.

### Install and offline check (on the deployed site)
- Android Chrome: menu → *Install app*. Desktop Chrome/Edge: install icon in the address bar (or the **Install app**
  button in the app header).
- iPhone/iPad Safari: Share → *Add to Home Screen*.
- Then turn on airplane mode and reopen the app. It should still load.
- Chrome DevTools → Lighthouse gives a quick PWA and accessibility report.

### Check the numbers
Open *Sources & notes* and compare a few lines with the official
[Budget at a Glance](https://www.indiabudget.gov.in/doc/Budget_at_Glance/budget_at_a_glance.pdf). Lines marked
"Derived" are computed from published totals.

## 2. Make the repository public
GitHub → repository → **Settings → General → Danger Zone → Change visibility → Make public**.
(Pages on a free plan requires a public repository.)

## 3. Publish with GitHub Pages — no secrets needed
The workflow in `.github/workflows/deploy.yml` uses GitHub's built-in token, so **you don't need to add any secrets**.

1. Merge this work into `main` (open a pull request from the working branch and merge it). The deploy job only runs
   on `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Open the **Actions** tab → *Test and deploy to GitHub Pages* and wait for it to finish (re-run it if it ran
   before you enabled Pages).
4. Your site: `https://sanmanbhusari.github.io/economy-visuals/`.

If the deploy job is refused: **Settings → Environments → github-pages** → make sure `main` is allowed under
*Deployment branches*.

## 4. Later: a custom domain
1. Buy a domain. In **Settings → Pages → Custom domain** enter it (e.g. `example.org`) and save.
2. At your registrar's DNS:
   - Apex domain (`example.org`): four `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`.
   - Subdomain (`www.example.org`): a `CNAME` record → `sanmanbhusari.github.io`.
3. Tick **Enforce HTTPS** once the certificate is issued (can take up to an hour).
4. **Settings → Secrets and variables → Actions → Variables → New repository variable**: name `BASE_PATH`, value `/`.
   This is a *variable*, not a secret. It makes the app load from the domain root instead of `/economy-visuals/`.
   Re-run the deploy workflow.
5. Optional: verify the domain under your account (**Settings → Pages → Add a domain**) so nobody else can claim it.

Docs: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site

## 5. Data verification (recommended before sharing widely)
The official budget website was not reachable from the environment this was built in, so the numbers were assembled
from search results quoting the Budget documents and PRS Legislative Research. Before promoting the site, compare each
figure in `src/data/india/union-2026-27.ts` with the PDFs linked in its `sources`; fix any differences and run
`npm test`, which checks that everything still adds up to the published totals (`checks`).
