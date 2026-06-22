# Exam #1: "The Last Race"

## Student: s355324 Rezaei Negar

## React Client Application Routes

- Route `/`: Landing page displaying game instructions for anonymous users, and a navigation button for logged-in users.
- Route `/login`: Authentication form for users to access the game system.
- Route `/game`: The core interactive game interface handling Setup (memorization), Planning (90s timer route construction), and Execution phases.
- Route `/ranking`: Displays the global leaderboard fetching the best scores of all players (only accessible to authenticated users).
- Route `*`: Fallback 404 page for invalid or non-existent URLs.

## API Server

- POST `/api/sessions`
  - request parameters and request body content: JSON object `{ username, password }`
  - response body content: `200 OK` with user object `{ id, username }` or `401 Unauthorized`
- GET `/api/sessions/current`
  - request parameters: None (uses session cookie)
  - response body content: `200 OK` with user object `{ id, username }` or `401 Unauthorized`
- DELETE `/api/sessions/current`
  - request parameters: None
  - response body content: `200 OK` with an empty object
- GET `/api/game/setup`
  - request parameters: None
  - response body content: `200 OK` with JSON object `{ start, target, minimum_distance, stations, segments, coins }`
- POST `/api/game/execute`
  - request parameters and request body content: JSON object `{ startStationId, targetStationId, selectedSegmentIds }`
  - response body content: `200 OK` with JSON object `{ valid, message, finalCoins, log }`
- GET `/api/games/ranking`
  - request parameters: None
  - response body content: `200 OK` with an array of objects `[{ username, score }]` ordered by highest score

## Database Tables

- Table `users` - contains registered users' credentials (id, username, salt, password)
- Table `stations` - contains the network's stations (id, name)
- Table `lines` - contains the metro lines available in the network (id, name)
- Table `segments` - contains the network graph defining connections between two stations on a specific line (id, station_a_id, station_b_id, line_id)
- Table `events` - contains the random events and their coin effects (id, description, effect)
- Table `games` - contains logged completed games for the leaderboard (id, user_id, score)

## Main React Components

- `App` (in `App.jsx`): The root component managing the React Router and global layout.
- `AuthProvider` (in `AuthContext.jsx`): Manages and provides the global user authentication state across the application.
- `Navigation` (in `Navigation.jsx`): The persistent top navigation bar handling active links and the logout action.
- `Home` (in `Home.jsx`): Displays instructions and smartly routes the user depending on their session status.
- `Game` (in `Game.jsx`): The engine component controlling timers, interactive SVG map rendering, route selection logic, and sequential event animations.
- `Ranking` (in `Ranking.jsx`): Fetches the top scores from the API and maps them into a leaderboard table.
- `ProtectedRoute` (in `ProtectedRoute.jsx`): A wrapper component that restricts unauthorized access to specific routes.

## Screenshots

![Gameplay Screenshot](./screenshot_game.png)
![Leaderboard Screenshot](./screenshot_leaderboard.png)

## Users Credentials

- Negar, passWord123!
- Sam, 9127435395 (Has previous successful games)
- Mike, 9127435395 (Has previous successful games)

## Use of AI Tools

During the development of this project, AI (Google Gemini) was utilized to brainstorm structural patterns for the React components, assist in generating CSS/Bootstrap styling for the UI (such as the interactive SVG map layout and animations), and debug complex asynchronous state updates. The generated suggestions were thoroughly reviewed, manually tested, and heavily adapted to strictly fit the specific graph validation requirements and exam constraints.
