class StepTrackerService {
  validateSteps(steps) {
    if (!Array.isArray(steps)) {
      throw new Error('Steps must be an array');
    }

    const validatedSteps = [];

    for (const step of steps) {
      if (!step || typeof step !== 'object') {
        continue;
      }

      const validatedStep = {
        operation: step.operation || 'unknown',
        description: step.description || '',
        data: step.data || {}
      };

      validatedSteps.push(validatedStep);
    }

    return validatedSteps;
  }

  formatSteps(steps) {
    return this.validateSteps(steps);
  }
}

module.exports = new StepTrackerService();
