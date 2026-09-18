/*
 * Ten plik jest parasolem zgodności: podział na moduły domenowe
 * (audyt P1-3) zmienił lokalizację funkcji, nie ich nazwy ani sygnatury.
 * Istniejące importy `from './support/teacher-edit'` działają bez zmian.
 * Nowy kod powinien importować bezpośrednio z właściwego modułu domenowego
 * poniżej.
 */

export * from './teacher-dialog';
export * from './teacher-history';
export * from './teacher-contact';
export * from './teacher-address';
export * from './teacher-notes';
export * from './teacher-rodo';
