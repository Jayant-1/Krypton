# Krypton Personalized AI Research Assistant Plan

## Overview
Krypton is upgraded into a personalized AI research assistant that guides users from topic discovery to literature review and research insights.

---

## User System
- User authentication (email or Google login)
- User profile storage
- Activity tracking and history

---

## User Profile
- Interests (AI, ML, NLP, Security)
- Skill level (Beginner, Intermediate, Advanced)
- Goal (Learning, Research, Startup)
- Output preference (Simple or Technical)

---

## Core Features

### Topic Discovery
- Suggest research topics based on user profile
- Align topics with user skill level and goals

---

### Guided Research Mode
- Step-by-step research guidance
- Structured workflow from basics to advanced papers

---

### Literature Review Generator
- Generate structured literature review
- Include introduction, methods, limitations, and gaps
- Adapt writing style based on user level

---

### Research Gap Detection
- Extract limitations from multiple papers
- Identify common research gaps
- Personalize gaps based on user level

---

### Market Gap and Project Ideas
- Identify real-world opportunities
- Generate startup and project ideas
- Align suggestions with user goals

---

### Assistant Chat
- Answer questions about papers
- Explain concepts based on user level
- Provide implementation guidance

---

### Personal Knowledge Memory
- Track read papers
- Track explored topics
- Allow users to resume research

---

### Continuous Personalization
- Track clicks and engagement
- Improve recommendations over time
- Adapt summaries and suggestions dynamically

---

## Backend Requirements
- User table
- User preferences table
- User activity table
- Saved papers table
- Research sessions table

---

## New APIs
- `/auth/login`
- `/auth/signup`
- `/user/profile`
- `/recommendations`
- `/generate-topic`
- `/generate-literature-review`

---

## Frontend Features
- User onboarding flow
- Dashboard with recommendations
- Buttons for topic generation and literature review
- Personalized paper ranking display

---

## Final Flow
1. Login  
2. Set profile  
3. Get topic suggestions  
4. Search papers  
5. Read summaries  
6. Find research gaps  
7. Generate literature review  
8. Get project ideas  

---