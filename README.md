# Skribbly
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/Crazeecoder01/skribbly)

Skribbly is a real-time, multiplayer drawing and guessing game inspired by Skribbl.io. Built with a modern tech stack, it allows users to create or join game rooms, draw a chosen word, and have others guess it in a race against the clock.

## Key Features

-   **Real-time Multiplayer:** Seamless gameplay using Socket.IO for instant communication.
-   **Game Rooms:** Create private rooms or join existing ones using a unique room code.
-   **Customizable Games:** Set the maximum number of players (2-8) and the number of rounds (1-10) when creating a room.
-   **Interactive Drawing Canvas:** A feature-rich canvas built with Fabric.js allows the drawer to express their creativity.
-   **Live Chat & Guessing:** Integrated chat for players to communicate and submit their guesses. Correct guesses are celebrated and revealed to all.
-   **Automated Turn Management:** The game automatically cycles through players, assigning one as the drawer for each turn.
-   **Word Selection:** The drawer gets to choose from three randomly selected words at the beginning of their turn.
-   **Dynamic Scoring:** Players earn points for guessing correctly, with scores awarded based on how quickly they guess. Drawers also earn points for each player that guesses their word.
-   **Turn & Game Summaries:** View a summary after each turn and a final scoreboard when the game ends.

## Technology Stack

This project is a monorepo managed with npm workspaces.

-   **Frontend:**
    -   Next.js
    -   React & TypeScript
    -   Tailwind CSS
    -   Socket.IO Client
    -   Fabric.js (for the drawing canvas)
    -   Axios

-   **Backend:**
    -   Node.js & Express
    -   TypeScript
    -   Socket.IO
    -   Prisma (ORM for PostgreSQL)
    -   Redis (for Socket.IO Adapter to enable multi-instance scaling)
    -   Docker

-   **Database:**
    -   PostgreSQL

-   **CI/CD & Deployment:**
    -   GitHub Actions
    -   Docker & Docker Compose
    -   NGINX (as a reverse proxy)

## Getting Started

### Prerequisites

-   Node.js (v20 or later)
-   npm (v9 or later)
-   Docker and Docker Compose
-   A running instance of PostgreSQL and Redis.

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/crazeecoder01/skribbly.git
    cd skribbly
    ```

2.  **Install dependencies:**
    From the root directory, run:
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `apps/backend/` directory and add the following variables, pointing to your local database and Redis instances:
    ```env
    # apps/backend/.env

    # Example PostgreSQL connection string
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # Example Redis connection string
    REDIS_URL="redis://HOST:PORT"

    PORT=4000
    ```

4.  **Run database migrations:**
    Apply the database schema to your PostgreSQL instance:
    ```bash
    npm run migrate
    ```
    You can also use Prisma Studio to view and manage your data:
    ```bash
    npm run studio
    ```

5.  **Run the development servers:**
    Open two separate terminals and run the following commands:

    *To start the backend server:*
    ```bash
    npm run dev:backend
    ```

    *To start the frontend server:*
    ```bash
    npm run dev:frontend
    ```
    The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:4000`.

### Running with Docker

The provided `docker-compose.yml` file will build and run the backend service along with an NGINX reverse proxy.

1.  **Ensure prerequisites are met:** Docker is running and you have created the `.env` file as described in step 3 of the local development setup.

2.  **Build and start the services:**
    From the root of the repository, run:
    ```bash
    docker-compose up --build -d
    ```
    This command will build the backend Docker image and start the `skribble-backend-1` and `nginx` containers. The NGINX server will be exposed on ports 80 and 443, proxying requests to the backend service.

## Project Structure

The repository is structured as a monorepo:

-   `.github/workflows/`: Contains CI/CD pipelines for testing and deployment.
-   `apps/`: Holds the individual applications.
    -   `backend/`: The Express.js and Socket.IO server.
        -   `prisma/`: Database schema and migrations.
        -   `src/`: Main source code, including controllers, routes, and socket event handlers.
    -   `frontend/`: The Next.js client application.
        -   `src/app/`: App Router pages and layouts.
        -   `src/components/`: Reusable React components.
        -   `src/hooks/`: Custom hooks for managing application logic.
-   `packages/`: Contains shared code used across the monorepo.
    -   `types/`: Shared TypeScript types and interfaces.
    -   `utils/`: Shared utility functions.
-   `Dockerfile`: Defines the Docker image for the backend service.
-   `docker-compose.yml`: Configures the services for Docker deployment.

## API Endpoints

The backend exposes the following REST API endpoints for managing rooms:

-   `POST /api/rooms/create`: Creates a new game room.
-   `POST /api/rooms/join`: Allows a user to join an existing room.
-   `POST /api/rooms/start`: Starts the game (can only be initiated by the room creator).
-   `POST /api/rooms/leave`: Removes a user from a room.

## Socket.IO Events

Real-time communication is handled through the following Socket.IO events:

| Event Name        | Direction          | Description                                                    |
| ----------------- | ------------------ | -------------------------------------------------------------- |
| `join-room`       | Client to Server   | A user joins a specific room.                                  |
| `leave-room`      | Client to Server   | A user leaves a room.                                          |
| `start-game`      | Client to Server   | The room host starts the game.                                 |
| `send-path`       | Client to Server   | Sends drawing data from the drawer's canvas.                   |
| `word-chosen`     | Client to Server   | The drawer selects a word to draw.                             |
| `send-guess`      | Client to Server   | A player submits a guess.                                      |
| `room-updated`    | Server to Clients  | Broadcasts updated room details (e.g., player list).           |
| `receive-path`    | Server to Clients  | Relays drawing data to all guessers.                           |
| `game-started`    | Server to Clients  | Notifies clients that the game has officially started.         |
| `start-turn`      | Server to Clients  | Informs clients of the new drawer and provides word choices.   |
| `turn-started`    | Server to Clients  | Notifies clients that a word has been chosen and the turn starts. |
| `turn-ended`      | Server to Clients  | Broadcasts the turn summary (word, correct guessers).          |
| `game-ended`      | Server to Clients  | Notifies clients that the game is over and sends final scores. |
| `update-scores`   | Server to Clients  | Sends updated scores to all players in the room.               |
| `correct-guess`   | Server to Clients  | Announces that a player has guessed the word correctly.        |
| `chat-message`    | Server to Clients  | Broadcasts a regular chat message or an incorrect guess.       |