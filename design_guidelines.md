# Focus Platform - Design Guidelines (محدث)

## Design Approach

**Light Mode:** Modern Blue & White Theme
**Dark Mode:** Contemporary Black & Green Theme
**Rationale:** Professional, accessible productivity platform with modern aesthetics

## Color Palette

### Light Mode (Blue & White)
- **Primary:** Blue (#0066CC - Friendly, Professional)
- **Background:** Pure White
- **Text:** Dark Blue (Dark Gray equivalent)
- **Accents:** Light Blue/Gray
- **Borders:** Subtle Gray

### Dark Mode (Black & Green)
- **Primary:** Vibrant Green (#22C55E - Modern, Active)
- **Background:** Almost Black (#0F172A - Rich, Not Pure Black)
- **Text:** Off-White
- **Accents:** Green with Dark Background
- **Borders:** Subtle Dark Gray

## Typography System

**Primary Font:** Inter (Modern, Clean)
**Secondary Font:** JetBrains Mono (Technical Elements)

**Hierarchy:**
- Page Titles: `text-3xl font-bold`
- Section Headers: `text-2xl font-semibold`
- Card Titles: `text-lg font-semibold`
- Body Text: `text-base font-normal`
- Secondary Text: `text-sm text-muted-foreground`
- Captions: `text-xs text-muted-foreground`

## Dark Mode Implementation

**HTML Structure:**
```html
<html class="dark"> <!-- Add/remove "dark" class -->
```

**Switching:**
- Detect system preference via `prefers-color-scheme`
- Provide manual toggle (Moon/Sun icon)
- Store preference in localStorage

**Tailwind Usage:**
```tailwind
className="bg-white dark:bg-black text-black dark:text-white"
```

## Layout & Spacing

**Spacing Scale:** 2, 4, 6, 8, 12, 16, 24, 32 (Tailwind)

**Container Widths:**
- Full: `max-w-7xl`
- Content: `max-w-4xl`
- Forms: `max-w-2xl`

## Components

### Cards
- **Light:** White with subtle blue border
- **Dark:** Dark blue-gray with green accent on hover

### Buttons
- **Primary:** Blue (Light), Green (Dark)
- **Secondary:** Gray (Light), Dark Gray (Dark)
- **Hover:** Color shift with shadow elevation

### Badges
- **Status:** Colored pills with appropriate theme
- **Skills:** Light background with dark text

### Interactive Elements
- All elements: min-height 44px (touch-friendly)
- Hover states: Subtle shadow elevation
- Active states: Scale down with color shift
- Focus: Visible ring (Blue/Green based on theme)

## Navigation

**Header:**
- Fixed top, platform-wide
- Logo, Search, Notifications, Profile
- Height: 64px
- Theme-aware background

**Sidebar (Optional):**
- Dark background (Darker shade of primary)
- Light text
- Active items highlighted with primary color

## Dark Mode Specific

- **No pure black backgrounds** - Use dark blue-gray (#0F172A range)
- **Increased contrast** - Green works better than blue for accents
- **Subtle borders** - Use transparent white instead of gray
- **Reduced alpha values** - Shadows less pronounced

## Interactions

- **Smooth transitions:** 200ms for all hover effects
- **Elevation on hover:** `hover:shadow-lg`
- **Scale on click:** `active:scale-95`
- **Color shifts:** Primary color changes based on theme

## Accessibility

- Contrast ratios: WCAG AA minimum
- Focus states: Clear blue ring (Light), green ring (Dark)
- Icons: 20px (nav), 16px (actions), 12px (indicators)
- All interactive elements keyboard accessible

## Creator Credit (حمزة هشام أحمد النادي)

- Position: Below header
- Style: `text-xs text-muted-foreground py-1 text-center border-b`
- Theme: Automatic (Light/Dark)

## Image Handling

**Avatars:** 32px (lists), 40px (headers), 128px (profiles)
**Project Thumbnails:** 16:9 ratio with fallback colors
**No hero images** - Productivity focus, not marketing
