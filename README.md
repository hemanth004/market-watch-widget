# 📈 Market Watch Widget

![Angular](https://img.shields.io/badge/Angular-21.1.4-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)
![RxJS](https://img.shields.io/badge/RxJS-Reactive-purple?logo=reactivex)
![Chart.js](https://img.shields.io/badge/Chart.js-Visualization-orange?logo=chartdotjs)
![Node.js](https://img.shields.io/badge/Node.js-v20.20.0-green?logo=node.js)
![Status](https://img.shields.io/badge/Status-Completed-brightgreen)

------------------------------------------------------------------------

## 📌 Project Overview

**MarketWatch** is a standalone trading widget built using
**Angular (Standalone Components)** and **TypeScript (Strict Mode)**.

It simulates a high-frequency trading dashboard component that:

-   Streams price updates every 2 seconds
-   Displays a live line/area chart of the last minute
-   Supports configurable threshold alerts
-   Optimizes rendering performance using OnPush strategy
-   Ensures memory safety during continuous streaming

The goal was to implement a **scalable, reactive, and
performance-conscious UI component**.

------------------------------------------------------------------------

## 🛠 Environment & Versions

  Tool          Version
  ------------- ---------------------
  Angular CLI   21.1.4
  Node.js       v20.20.0
  npm           11.10.1
  TypeScript    Strict Mode Enabled

------------------------------------------------------------------------

## 🏗 Architecture

The solution follows clear separation of concerns:

### 🔹 Data Layer (Mock Stream Service)

-   RxJS-based pseudo WebSocket using `interval(2000)`
-   Emits random float between **100.00 -- 200.00**
-   Exposes `start()` and `stop()`
-   Uses `BehaviorSubject` for latest-value retention

### 🔹 Business Logic Layer

-   Handles trend detection (⬆ / ⬇)
-   Maintains rolling 1-minute sliding window
-   Applies threshold alert logic
-   Controls connection state (Pause/Resume)

### 🔹 Visualization Layer

-   Chart.js line + gradient area chart
-   Incremental dataset updates
-   No chart recreation on each tick

------------------------------------------------------------------------

## ⚡ Real-Time Stream Management

### Stream Behavior

-   Emits new price every 2 seconds
-   On pause → subscription unsubscribes
-   On resume → stream starts fresh

**Trade-off Decision:**\
The stream restarts cleanly instead of replaying missed ticks to avoid
artificial burst updates and maintain realistic behavior.

------------------------------------------------------------------------

## 📊 Performance Strategy

### ✅ OnPush Change Detection

Prevents unnecessary re-renders of parent components.

### ✅ Incremental Chart Updates

Uses:

``` ts
this.chart.update('none');
```

Avoids animation reset and improves smoothness.

### ✅ Sliding Window Memory Control

Maintains only the last 60 seconds of data to ensure stable memory
usage.

### ✅ Proper Cleanup

-   `takeUntil` for RxJS subscriptions
-   `ngOnDestroy` teardown
-   Chart instance destruction

No memory leaks during unmount.

------------------------------------------------------------------------

## 🚨 Business Logic

### Threshold Alert

-   User inputs a numeric threshold
-   If latest price exceeds threshold:
    -   Widget border turns **red**
    -   Alert message appears

### Trend Indicator

-   ⬆ if price increased
-   ⬇ if price decreased

------------------------------------------------------------------------

## 🧪 Type Safety & Code Quality

-   TypeScript Strict Mode enabled
-   Strongly typed `PriceTick` interface
-   No `any` usage
-   Clean service-component separation

------------------------------------------------------------------------

## 🎨 UI & Styling

-   SCSS-based styling
-   Responsive layout
-   Visual state indicators
-   Professional financial UI aesthetic

### ✨ Recent UI Enhancements

- **Layout Stability:** Fixed DOM jittering by replacing conditional `*ngIf` unmounting of the alert badge with CSS `visibility` toggling.
- **Whitespace Polish:** Corrected header flex-alignments, reduced extraneous margins between controls, and aligned line-heights for a tighter, cleaner widget layout.
- **Threshold Visibility:** The threshold input field was improved with a distinct background footprint, structural borders, and interactive hover states to stand out beautifully against the widget background.
- **Integrations:** Decreased overall component outer margins so the widget embeds cleanly inside host containers like the Live Demonstration section.

------------------------------------------------------------------------

## ▶ How to Run

``` bash
npm install
ng serve
```

Open `http://localhost:4200`

------------------------------------------------------------------------

## 🚀 Potential Enhancements

-   Replace mock stream with real WebSocket
-   Add reconnection strategy
-   Add unit tests for trimming logic
-   Accessibility improvements
-   Server-driven alert configuration

------------------------------------------------------------------------

## 🏁 Conclusion

This project demonstrates:

-   Reactive stream handling with RxJS
-   Performance-aware Angular architecture
-   Real-time visualization with optimized rendering
-   Memory-safe continuous data processing
-   Clean and maintainable frontend design

Designed to simulate a production-ready trading dashboard component.
