// utils/FinanceUtils.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Fachliche Berechnungen für Zeitreihen und Performance

export const FinanceUtils = {
  /**
   * Bestimmt das Aggregations-Level basierend auf dem gewählten Zeitfenster.
   */
  determineAggregation: (timeLimit) => {
    if (timeLimit === 0) return 'MONTHLY'; // 'ALL' Standard
    
    const diffDays = (Date.now() - timeLimit) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 300) return 'MONTHLY'; // > 10 Monate
    if (diffDays > 100) return 'WEEKLY';  // > 3 Monate
    return 'DAILY';                       // Bis 3 Monate
  },

  /**
   * Berechnet die Performance zwischen dem aktuellen Gesamtwert 
   * und dem Startwert des gewählten Zeitraums.
   */
  calculatePerformance: (currentTotal, startValue) => {
    if (!startValue || startValue === 0) {
      return { nominal: 0, percent: 0 };
    }
    
    const nominal = currentTotal - startValue;
    const percent = (nominal / startValue) * 100;
    
    return { nominal, percent };
  }
};