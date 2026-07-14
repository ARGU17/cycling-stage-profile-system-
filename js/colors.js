export const GRADE_BANDS = [
  { min: -Infinity, max: -9, color: '#1a4bff', label: '< -9%' },
  { min: -9, max: -6, color: '#2c7cff', label: '-9% a -6%' },
  { min: -6, max: -3, color: '#2bb2ff', label: '-6% a -3%' },
  { min: -3, max: -1, color: '#24c6c6', label: '-3% a -1%' },
  { min: -1, max: 1.5, color: '#14b81f', label: '-1% a 1.5%' },
  { min: 1.5, max: 3, color: '#63cf15', label: '1.5% a 3%' },
  { min: 3, max: 5, color: '#b5c718', label: '3% a 5%' },
  { min: 5, max: 7, color: '#e4c625', label: '5% a 7%' },
  { min: 7, max: 9, color: '#ee9430', label: '7% a 9%' },
  { min: 9, max: Infinity, color: '#dd5a22', label: '> 9%' }
];

export function getGradeColor(grade) {
  for (const band of GRADE_BANDS) {
    if (grade > band.min && grade <= band.max) return band.color;
  }
  return GRADE_BANDS[4].color;
}
