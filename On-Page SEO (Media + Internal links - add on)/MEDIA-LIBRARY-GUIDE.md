# Media Library — Setup Guide

## Overview

The Media Library lets you create topic-based collections of images and YouTube videos from your WordPress site. When generating blog content, select a collection and the AI will auto-insert media contextually into the generated markdown.

## Setup Steps

### 1. Import the n8n Workflow

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Select `media-library-manager-workflow.json`
4. Activate the workflow
5. Copy the **Production** webhook URL (should end with `/webhook/ml-manager`)

### 2. Configure the Webhook in the App

1. Open the SEO tool → **Reference** → **Media Library**
2. Paste the webhook URL into the **Media Library Manager Webhook** field
3. Click **Save webhook**
4. Click **Test** — should show "connected"

### 3. Create a Collection

1. In the **Create Collection** section, enter a name (e.g., "Hair Restoration")
2. Optionally add a description
3. Click **Create Collection**

### 4. Add Media Items

1. In the **Add Media Items** section, select your collection from the dropdown
2. Paste URLs into the textarea, **one URL per line**:
   ```
   https://thinhairgrowthguide.com/wp-content/uploads/2026/07/My-long-hair-style-for-thin-hair.png
   https://thinhairgrowthguide.com/wp-content/uploads/2026/07/before-after-hair.png
   https://youtube.com/watch?v=abc123
   ```
3. Click **Add Media Items**
4. Alt text is auto-extracted from the filename (e.g., `My-long-hair-style-for-thin-hair.png` → "My Long Hair Style For Thin Hair")
5. Media type is auto-detected (image vs YouTube)

### 5. Use in Blog Post Creation

1. Go to **Creation** → **Blog Post Creation**
2. Fill in your topic, keywords, outline as usual
3. In the **Media Library** dropdown, select your collection
4. Generate content — the AI will auto-insert images and video links where contextually relevant

## How It Works

When a Media Library collection is selected:

1. The n8n workflow fetches all media items from the collection
2. Items are injected into the LLM prompt as a `<media_library>` block
3. The AI receives placement rules:
   - Insert images where they support the surrounding paragraph
   - Use `![alt text](url)` markdown syntax
   - Place YouTube links as standalone lines where relevant
   - Only use media that genuinely fits — don't force placement
   - Max 1 image per H2 section, max 1 video per blog post

## Supported URL Formats

- **WordPress media**: `https://yourdomain.com/wp-content/uploads/...`
- **YouTube videos**: `https://youtube.com/watch?v=...` or `https://youtu.be/...`
- **Any image URL**: Direct links to `.png`, `.jpg`, `.webp`, etc.

## Data Storage

Collections and items are stored in n8n workflow static data (same as Story Bank). This means:
- Data persists as long as the workflow is active
- Data may be lost on n8n restart or redeployment
- For critical media, keep a backup of your URLs

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Could not load collections" | Check webhook URL is correct and workflow is activated |
| "Invalid URLs" error | Ensure each line is a valid URL starting with `https://` |
| Media not appearing in blog | Verify collection is selected in the dropdown before generating |
| Items not saving | Test webhook connection, check n8n workflow is active |
