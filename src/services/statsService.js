class StatsService {
  generateStats(steps) {
    if (!Array.isArray(steps)) {
      return {
        totalSteps: 0,
        comparisons: 0,
        swaps: 0
      };
    }

    let comparisons = 0;
    let swaps = 0;

    for (const step of steps) {
      if (step.operation === 'compare') {
        comparisons++;
      } else if (step.operation === 'swap') {
        swaps++;
      }
    }

    return {
      totalSteps: steps.length,
      comparisons,
      swaps
    };
  }
}

module.exports = new StatsService();
