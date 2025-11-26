# Accessibility Guide

## Keyboard Shortcuts

### Guides Page (`/pages/guides`)

| Action | Shortcut | Description |
|--------|----------|-------------|
| Navigate | `Tab` | Μετακίνηση μεταξύ interactive elements |
| Navigate backwards | `Shift + Tab` | Μετακίνηση προς τα πίσω |
| Search | `Tab` → Type | Φόκους στο search bar και αναζήτηση |
| Open Filters | `Tab` → `Enter/Space` | Άνοιγμα του filters panel |
| Close Filters | `Escape` | Κλείσιμο του filters panel |
| Adjust Slider | `Arrow Left/Right` | Αλλαγή τιμής σε range sliders |
| Open Dropdown | `Enter/Space` | Άνοιγμα dropdown menu |
| Close Dropdown | `Escape` | Κλείσιμο dropdown χωρίς επιλογή |
| Select Option | `Enter/Space` | Επιλογή από dropdown |
| Navigate Options | `Tab` | Μετακίνηση στις επιλογές dropdown |

## Screen Reader Support

### Components με ARIA Support

#### SearchBar
- `role="search"` - Σηματοδοτεί περιοχή αναζήτησης
- `aria-label` - Περιγραφή του search field
- `type="search"` - Σωστός HTML5 τύπος

#### HourFilter & YearFilter
- `<fieldset>` & `<legend>` - Semantic HTML
- `aria-label` - Περιγραφή κάθε slider
- `aria-valuemin/max/now/text` - Τρέχουσα τιμή για screen readers

#### DifficultyFilter
- Χρησιμοποιεί `SingleSlider` component με πλήρη ARIA support
- `aria-valuetext` ανακοινώνει τιμή δυσκολίας (0-10)

#### Dropdowns (Platform, Genre, Developer)
- `aria-haspopup="listbox"` - Δηλώνει ότι ανοίγει λίστα επιλογών
- `aria-expanded` - Κατάσταση dropdown (ανοιχτό/κλειστό)
- `role="listbox"` - Λίστα επιλογών
- `role="option"` - Κάθε επιλογή
- `aria-selected` - Επιλεγμένη επιλογή

#### FiltersPanel
- `<section>` with `aria-label="Φίλτρα αναζήτησης"`
- `Escape` key support για κλείσιμο
- Auto-focus όταν ανοίγει

#### SortFilter
- `aria-label` στο κουμπί ταξινόμησης
- Περιγραφική ετικέτα για την τρέχουσα σειρά

## Testing Checklist

### Manual Keyboard Testing
- [ ] Όλα τα elements προσβάσιμα με `Tab`
- [ ] Visible focus indicator σε όλα τα interactive elements
- [ ] `Escape` κλείνει modals/dropdowns
- [ ] `Enter/Space` ενεργοποιεί buttons/options
- [ ] Arrow keys λειτουργούν σε sliders
- [ ] Tab order είναι λογικός

### Screen Reader Testing (NVDA/JAWS)
- [ ] Όλα τα labels διαβάζονται σωστά
- [ ] Slider values ανακοινώνονται
- [ ] Dropdown states (expanded/collapsed) ανακοινώνονται
- [ ] Selected options ανακοινώνονται
- [ ] Search region αναγνωρίζεται

### Automated Testing (Lighthouse)
- [ ] Accessibility score > 90
- [ ] Όλα τα images έχουν alt text
- [ ] Color contrast ratios είναι αποδεκτά
- [ ] HTML semantic structure είναι σωστή

## Implementation Details

### Components Updated
1. **HourFilter.tsx** - Added fieldset/legend, ARIA attributes
2. **YearFilter.tsx** - Added fieldset/legend, ARIA attributes
3. **SingleSlider.tsx** - Added fieldset/legend, ARIA attributes
4. **SearchBar.tsx** - Added role="search", aria-label
5. **Dropdown.tsx** - Added ARIA listbox/option pattern, keyboard navigation
6. **SortFilter.tsx** - Added aria-label to button
7. **FiltersPanel.tsx** - Added section element, Escape key support

### ARIA Patterns Used
- **Search** - `role="search"`, `type="search"`
- **Slider** - `aria-valuemin/max/now/text`
- **Listbox** - `role="listbox"`, `role="option"`, `aria-selected`
- **Button** - `aria-label`, `aria-expanded`, `aria-haspopup`
- **Landmark** - `<section>` with `aria-label`

### Keyboard Event Handlers
- `Escape` - Close panels and dropdowns
- `Enter/Space` - Activate buttons and select options
- `Arrow Keys` - Navigate sliders (native browser behavior)
- `Tab` - Navigate between elements (native browser behavior)

## Browser Support

Tested and working on:
- Chrome/Edge (Chromium)
- Firefox
- Safari

Screen readers tested:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)

## Future Improvements

### Potential Enhancements
- [ ] Add arrow key navigation within dropdown lists
- [ ] Add `Home/End` keys to jump to min/max on sliders
- [ ] Add visual keyboard shortcuts guide (modal)
- [ ] Add `?` keyboard shortcut to show help
- [ ] Consider adding skip navigation links
- [ ] Add focus trap for modal dialogs
- [ ] Add live regions for dynamic content updates

### Advanced Features
- [ ] Keyboard shortcuts customization
- [ ] High contrast mode toggle
- [ ] Font size adjustment
- [ ] Reduced motion preference support
- [ ] Focus visible polyfill for older browsers

## Resources

- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [NVDA Screen Reader Download](https://www.nvaccess.org/download/)
- [Chrome DevTools Accessibility Reference](https://developer.chrome.com/docs/devtools/accessibility/reference/)
