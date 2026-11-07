# Product Vision

## Vision Statement
A personal knowledge workspace where ideas are connected, not siloed — combining the structure of an outline with the power of a knowledge graph.

## Design Philosophy

### 1. Notes First
Every feature decision should be evaluated by how it serves notes. The note editor, hierarchy, relationships, and graph all exist to make individual notes more valuable.

### 2. Two Mental Models, One System
Users naturally think both hierarchically (categories, folders, outlines) and relationally (connections, dependencies, references). Knowledge App supports both without forcing a choice.

### 3. Progressive Complexity
Start with simple note-taking. Add hierarchy when needed. Add relationships when patterns emerge. Explore the graph when complexity grows.

### 4. Non-Destructive Organization
Moving a note within the hierarchy must never break its relationships. Organization and connection are independent concerns.

## Core User Journeys

### Journey 1: Capture
User creates a note, writes content in the rich text editor, and assigns it a parent folder.

### Journey 2: Organize
User builds a topic hierarchy by creating folders and moving notes into them. Notes maintain their relationships through moves.

### Journey 3: Connect
User notices that "JWT Authentication" relates to both "Spring Security" and "HTTP". They create explicit relationships without changing the hierarchy.

### Journey 4: Discover
User opens the Knowledge Graph to visually explore how concepts connect. They click a node to open the note, follow relationships to related notes.

### Journey 5: Retrieve
User searches for "authentication" and finds all relevant notes by title, content, and tags.

## Principles for Future Development
1. Never require the user to choose between hierarchy and graph — support both
2. Keep the note editor as the primary workspace
3. Make relationships first-class citizens, not footnotes
4. Optimize for personal use first, collaborative use later
5. Keep the UI focused; avoid feature bloat
