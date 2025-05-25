# Cocktail Recipe Web App - PRD

## Core Purpose & Success
- **Mission Statement**: A beautiful, intuitive web app for creating, storing, and scaling cocktail recipes with specialized features for advanced techniques.
- **Success Indicators**: User engagement with recipe creation, successful recipe scaling, and effective use of specialty features.
- **Experience Qualities**: Elegant, Intuitive, Professional.

## Project Classification & Approach
- **Complexity Level**: Light Application (multiple features with basic state)
- **Primary User Activity**: Creating (recipes, calculations)

## Thought Process for Feature Selection
- **Core Problem Analysis**: Cocktail enthusiasts need a specialized tool that handles unique aspects of mixology like scaling and clarification.
- **User Context**: Users will engage when planning cocktail menus, experimenting with recipes, or preparing for events.
- **Critical Path**: Open app → Create/search recipe → Save recipe → Scale recipe or calculate clarification
- **Key Moments**: 
  1. Creating and saving a custom recipe
  2. Successfully scaling a recipe for batch preparation
  3. Calculating milk clarification quantities

## Essential Features
1. **Recipe Creation & Storage**
   - Create cocktail recipes with ingredient quantities in ounces
   - Save recipes to local storage in JSON format
   - View saved recipes in an organized manner

2. **Ingredient Search**
   - Search through previously used ingredients 
   - Quick ingredient selection from history
   - Auto-complete for common ingredients

3. **Batch Recipe Scaling**
   - Scale recipes for multiple servings
   - Calculate water dilution percentage
   - Adjust total volume based on dilution

4. **Milk Clarification Calculator**
   - Calculate milk quantities needed based on recipe volume
   - Adjust clarification percentage
   - Preview expected yields

5. **Recipe Categorization**
   - Assign categories to recipes (e.g., stirred, shaken, highball)
   - Filter recipes by category
   - Visual category indicators on recipe cards

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Sophisticated, confident, creative
- **Design Personality**: Elegant with modern touches, professional but approachable
- **Visual Metaphors**: Bar tools, glassware, liquid motion
- **Simplicity Spectrum**: Clean, minimalist interface with rich functionality

### Color Strategy
- **Color Scheme Type**: Analogous with dark accents
- **Primary Color**: Deep amber (oklch(0.82 0.18 60)) - represents spirits, warm and inviting
- **Secondary Colors**: Rich burgundy (oklch(0.55 0.25 25)) - represents wine/mixers
- **Accent Color**: Bright citrus (oklch(0.9 0.18 100)) - represents garnishes/highlights
- **Color Psychology**: Warm colors evoke sophistication and craftsmanship associated with quality cocktails
- **Color Accessibility**: High contrast between text and backgrounds for readability
- **Foreground/Background Pairings**:
  - Background: Deep charcoal (oklch(0.2 0.02 240)) with foreground: Soft white (oklch(0.98 0.005 240))
  - Card: Deep navy blue (oklch(0.3 0.05 265)) with card-foreground: Soft white (oklch(0.98 0.005 240))
  - Primary: Deep amber (oklch(0.82 0.18 60)) with primary-foreground: Dark charcoal (oklch(0.2 0.02 240))
  - Secondary: Rich burgundy (oklch(0.55 0.25 25)) with secondary-foreground: Soft white (oklch(0.98 0.005 240))
  - Accent: Bright citrus (oklch(0.9 0.18 100)) with accent-foreground: Dark charcoal (oklch(0.2 0.02 240))
  - Muted: Muted gray-blue (oklch(0.35 0.03 250)) with muted-foreground: Soft gray (oklch(0.8 0.02 240))

### Typography System
- **Font Pairing Strategy**: Elegant serif for headings paired with clean sans-serif for body text
- **Typographic Hierarchy**: Clear distinction between recipe titles, ingredients, instructions
- **Font Personality**: Refined, classic with modern execution
- **Readability Focus**: High contrast, appropriate line height for recipe instructions
- **Typography Consistency**: Consistent type treatment across all recipe cards and forms
- **Which fonts**: 
  - Headings: "Playfair Display" (elegant serif)
  - Body: "Source Sans Pro" (clean, readable sans-serif)
- **Legibility Check**: Both fonts have excellent legibility at various sizes

### Visual Hierarchy & Layout
- **Attention Direction**: Recipe name and image first, followed by ingredients, then instructions
- **White Space Philosophy**: Generous spacing around recipe cards and between sections
- **Grid System**: Card-based layout for recipes with consistent spacing
- **Responsive Approach**: Stack cards vertically on mobile, grid on larger screens
- **Content Density**: Balanced - recipes compact enough to see multiple options but with clear separation

### Animations
- **Purposeful Meaning**: Subtle liquid-inspired animations for transitions
- **Hierarchy of Movement**: Primary animations on recipe cards and form submissions
- **Contextual Appropriateness**: Gentle animations for calculator sliders and toggles

### UI Elements & Component Selection
- **Component Usage**: 
  - Cards for recipes
  - Dialogs for detailed recipe view
  - Forms for recipe creation
  - Sliders for adjusting batch sizes and percentages
  - Tabs for navigating between main features
- **Component Customization**: Rounded corners on cards, custom form styling
- **Component States**: Hover effects on recipe cards, active state for current calculator
- **Icon Selection**: Glass icons, measurement icons, mixing tools
- **Component Hierarchy**: Primary actions (create recipe) most prominent, secondary (search) easily accessible
- **Spacing System**: Consistent 4px base spacing system (0.5rem, 1rem, 1.5rem, 2rem)
- **Mobile Adaptation**: Stacked layout, larger touch targets for form inputs

### Visual Consistency Framework
- **Design System Approach**: Component-based design with reusable recipe cards
- **Style Guide Elements**: Typography scale, color palette, spacing rules
- **Visual Rhythm**: Consistent card sizing and spacing throughout
- **Brand Alignment**: Professional, elevated aesthetic for craft cocktails

### Accessibility & Readability
- **Contrast Goal**: WCAG AA compliance for all text and UI elements

## Edge Cases & Problem Scenarios
- **Potential Obstacles**: Large recipe collections may require pagination
- **Edge Case Handling**: Handle non-standard measurements gracefully
- **Technical Constraints**: Local storage limitations for extensive recipe collections

## Implementation Considerations
- **Scalability Needs**: Future expansion for sharing recipes, community features
- **Testing Focus**: Validate calculation accuracy for batch scaling and clarification
- **Critical Questions**: How to handle recipe versioning and updates?

## Reflection
- This approach uniquely addresses the specialized needs of cocktail enthusiasts with targeted tools
- Assumption to challenge: Are users familiar with milk clarification techniques?
- An exceptional solution would integrate visual cues for dilution ratios and clarification processes