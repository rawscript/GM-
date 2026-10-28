# GM System

The GM System is designed as a screening, monitoring and triage aid for outbreak response in Kenya. It does not diagnose. Laboratory confirmation remains with national laboratories. Wrist temperature is skin temperature, and wearable views show trends against a personal baseline. The electronic-nose module is described as experimental shadow-mode work and does not affect a referral decision. ADaM owns the official case and case status.

## Run locally

Install the declared dependencies with `npm install`, then use `npm run dev`. Build with `npm run build` and preview with `npm run preview`.

## Architecture

The application uses Vite and browser-native JavaScript modules. `src/app` owns route rendering and shells. `src/content` contains public route copy. `src/domain` contains pure decision and summary helpers. `src/data` contains local operational fixtures. `src/services` contains service boundaries, including the local role-session contract. `src/design` owns design tokens and component styling. `src/features` is reserved for independently sliced feature modules. `src/shared` contains shared presentation assets and partials.

The browser console uses deterministic local fixtures. The login control demonstrates a client-side role boundary; it is not an identity provider. Replace it with an approved authentication service before operational use. The ADaM route defaults to standalone export and explains that connected phases depend on agreed interfaces. No live patient information is included.

## Add a route

Add public copy to `src/content/pages.js`, add its path to `publicLinks`, and add any route-specific presentation in `src/app/main.js`. Console pages are routed beneath `/console` and share the authenticated shell. Keep data access in repositories and keep rule calculations in pure domain modules.

## Add a feature

Create a feature folder under `src/features` with a view, controller and local state module. Expose the public entry through one index module. Communicate between features through the application event bus when introduced; do not import implementation files from sibling features.

## Add a design token

Add a custom property in the `tokens` layer of `src/design/tokens.css`. Reference it from component or page layers rather than adding one-off colour values. Keep clinical tier colours confined to labelled and shaped status indicators.

## Add an animation

Register an animation by name in the central motion module when the motion registry is introduced. Route components request the registered name and do not import GSAP directly. Reduced-motion handling belongs in the registry.

## Quality commands

The package scripts expose `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run images`. Browser tests use Playwright and axe-core. Image manifest entries must include a meaningful alt description, commercial-use credit and source page URL. The fetch script refuses to invent or use unverified photography sources.
