/* The shelves of the Library, in order. Add one here and give pieces
   `series: <id>` to shelve them on it. */
export const SERIES = [
  { id: 'succession', no: 'Shelf I', name: 'The Succession Papers',
    note: 'On what happens to people after the money arrives, written before it has.' },
  { id: 'efficiency', no: 'Shelf II', name: 'Notes on Capital Efficiency',
    note: 'On doing more with a software subscription than an industry does with a data centre.' },
  { id: 'essays', no: 'Shelf III', name: 'Essays',
    note: 'Everything else. Not filings, not jokes — or not only jokes.' },
  { id: 'unfiled', no: 'Shelf IV', name: 'Unfiled',
    note: 'Titles exist. The pieces do not. They are shelved anyway, to create obligation.' },
];

/* Volumes that do not exist yet. They stand on the shelf in outline. */
export const PLANNED = [
  { title: 'The fourth house', series: 'succession', dek: 'On the things people buy once the obvious things are bought.' },
  { title: 'What about the yacht', series: 'succession', dek: 'A defence of spending, filed by someone who cannot.' },
  { title: 'On the word "just"', series: 'efficiency', dek: 'Why every large company describes itself as a small one.' },
  { title: 'Round-tripping', series: 'efficiency', dek: 'Money that goes in a circle and is counted twice.' },
  { title: 'A note on being early', series: 'unfiled', dek: 'Indistinguishable from being wrong, until it is not.' },
  { title: 'Untitled', series: 'unfiled', dek: 'There is not even a title. It is shelved to create obligation.' },
];
