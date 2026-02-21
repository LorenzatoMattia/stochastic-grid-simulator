# Stochastic Grid Simulator

> A cellular automaton that simulates the emergent spread and extinction (of fire?) across a grid. Driven entirely by local probabilistic rules.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://lorenzatomattia.github.io/stochastic-grid-simulator/)
[![Built with React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-⚡-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)

**[→ Try the live demo here!](https://lorenzatomattia.github.io/stochastic-grid-simulator/)**

---

## What is this?

Complex global behavior, emerging from three simple local rules. No central controller — just cells talking to their neighbors.

An interactive exploration of **emergent systems**: how chaos, spread, and collapse arise from nothing more than probabilistic interactions at the microscale. Each step, every cell on the grid looks only at its immediate neighbors and decides its fate.

---

## The Rules

### :one: Aging → Auto-Extinction
An active (on) cell has a finite lifespan. Once it has been alive for a certain number of life steps, it is exhausted. Fire self-consumes.

### :two: Crowding → Suppression (Deactivation)
An active (on) cell surrounded by other active (on) cells has a probability probExtinguish of being suppressed by each of its neighbors. The more active neighbors = greater probability of extinction. (greater competition for resources)

```
P(suppressed) = 1 − (1 − probExtinguish)^k
```

### :three: Proximity → Ignition (Activation)
A dormant (off) cell adjacent to active (on) cells has a probability of igniting, determined by probSpread. The more active neighbors = greater probability of igniting.

```
P(ignites) = 1 − (1 − probSpread)^k
```

These three rules, applied simultaneously to every cell at every step, give rise to complex propagation waves, isolated clusters, and sudden collapses — none of which are explicitly programmed.

---

## Core Logic
```typescript
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    const isOn = prevGrid[r][c];
    const k = neighborCount[r][c]; // burning neighbors

    if (isOn) {
      // Rule 1: Auto-extinguish
      if (ageGrid[r][c] + 1 >= lifespan) {
        nextGrid[r][c] = false;
        nextAgeGrid[r][c] = 0;
      } else {
        // Rule 2: Deactivation by neighbor (s)
        const suppressed = k > 0 && Math.random() > Math.pow(1 - probExtinguish, k);
        nextGrid[r][c] = !suppressed;
        nextAgeGrid[r][c] = suppressed ? 0 : ageGrid[r][c] + 1;
      }
    } else {
      // Rule 3: Proximity-based activation (a)
      if (k > 0 && Math.random() < 1 - Math.pow(1 - probSpread, k)) {
        nextGrid[r][c] = true;
        nextAgeGrid[r][c] = 1;
      }
    }
  }
}
```

---

## Getting Started

1. **Clone**

    ```bash
    git clone https://github.com/lorenzatomattia/stochastic-grid-simulator.git
    cd stochastic-grid-simulator
    ```
    
3. **Install**

    ```bash
    npm install
    ```
    
4. **Run**

    ```bash
    npm run dev
    ```

Open `http://localhost:5173` and watch it burn. 🔥

---

## Stack

| Tool | Role |
|------|------|
| [React](https://react.dev/) | UI & rendering |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Blazing fast dev server |

---

## Concepts Explored *(no utility, lots of expandability)*

- Cellular automata
- Stochastic / probabilistic systems
- Emergent complexity from local rules
- Transitions: spread vs. extinction equilibrium

---

*here's your cookie for reading it all* → :cookie:
