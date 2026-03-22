# kokuho-keisan

Japan National Health Insurance calculator  
(municipality rule-based system)

---

## Overview
This project is a rule-based calculator for Japan's National Health Insurance (国民健康保険).

It allows users to estimate insurance premiums based on municipality-specific rules.

---

## Current Status
- Available: Chigasaki City (茅ヶ崎市)
- Features:
  - Simple calculation
  - Income-based calculation

---

## Structure

Data flow:

index.html  
↓  
test/chigasaki-kokuho.html  
↓  
test/js/engine.js  
↓  
test/data/municipalities/chigasaki/kokuho-2025.json

---

## Concept

- Municipality-based rule engine
- Transparent calculation logic
- Expandable to all 1700 municipalities in Japan

---

## Future Plan

- Add more municipalities
- Add more systems (tax, pension, etc.)
- Build Civic Rule Lab system

---

## Live Site

https://kokuho-keisan.jp/

---

## Author

Civic Rule Lab
