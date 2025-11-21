// Maps backend socket progress to 33-node tree activations

export interface ProgressMapping {
  active: string[];
  completed: string[];
}

/**
 * Map backend stage/substep to active and completed node IDs
 */
export function mapProgressToNodes(stage: number, substep?: string): ProgressMapping {
  const mapping: Record<string, ProgressMapping> = {
    // ===== STAGE 1: Upload & Storage =====
    '1-upload': {
      active: ['node-1'],
      completed: [],
    },
    '1-store': {
      active: ['node-2'],
      completed: ['node-1'],
    },
    '1-queue': {
      active: ['node-3'],
      completed: ['node-1', 'node-2'],
    },

    // ===== STAGE 2: Encryption & Dispatch =====
    '2-encrypt': {
      active: ['node-4'],
      completed: ['node-1', 'node-2', 'node-3'],
    },
    '2-dispatch': {
      active: ['node-4'],
      completed: ['node-1', 'node-2', 'node-3'],
    },

    // ===== STAGE 3: Enclave Dispatch =====
    '3-dispatch': {
      active: ['node-5', 'node-13', 'node-21'], // All 3 enclaves fetch in parallel
      completed: ['node-1', 'node-2', 'node-3', 'node-4'],
    },

    // ===== STAGE 4: Enclave Processing (Parallel) =====
    
    // Enclave 1
    '4-e1-fetch': {
      active: ['node-5'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4'],
    },
    '4-e1-key-req': {
      active: ['node-6'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'],
    },
    '4-e1-key-recv': {
      active: ['node-7'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6'],
    },
    '4-e1-fetch-media': {
      active: ['node-8'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7'],
    },
    '4-e1-reverse': {
      active: ['node-9'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8'],
    },
    '4-e1-ai': {
      active: ['node-10'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8', 'node-9'],
    },
    '4-e1-report': {
      active: ['node-11'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10'],
    },
    '4-e1-attest': {
      active: ['node-12'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11'],
    },

    // Enclave 2 (parallel)
    '4-e2-fetch': {
      active: ['node-13'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4'],
    },
    '4-e2-key-req': {
      active: ['node-14'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-13'],
    },
    '4-e2-key-recv': {
      active: ['node-15'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-13', 'node-14'],
    },
    '4-e2-fetch-media': {
      active: ['node-16'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-13', 'node-14', 'node-15'],
    },
    '4-e2-reverse': {
      active: ['node-17'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-13', 'node-14', 'node-15', 'node-16'],
    },
    '4-e2-ai': {
      active: ['node-18'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-13', 'node-14', 'node-15', 'node-16', 'node-17'],
    },
    '4-e2-report': {
      active: ['node-19'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18'],
    },
    '4-e2-attest': {
      active: ['node-20'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19'],
    },

    // Enclave 3 (parallel)
    '4-e3-fetch': {
      active: ['node-21'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4'],
    },
    '4-e3-key-req': {
      active: ['node-22'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-21'],
    },
    '4-e3-key-recv': {
      active: ['node-23'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-21', 'node-22'],
    },
    '4-e3-fetch-media': {
      active: ['node-24'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-21', 'node-22', 'node-23'],
    },
    '4-e3-reverse': {
      active: ['node-25'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-21', 'node-22', 'node-23', 'node-24'],
    },
    '4-e3-ai': {
      active: ['node-26'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-21', 'node-22', 'node-23', 'node-24', 'node-25'],
    },
    '4-e3-report': {
      active: ['node-27'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26'],
    },
    '4-e3-attest': {
      active: ['node-28'],
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27'],
    },

    // ===== STAGE 5: Aggregation & Consensus =====
    '5-aggregate': {
      active: ['node-29'],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
      ],
    },
    '5-consensus': {
      active: ['node-30'],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
        'node-29',
      ],
    },

    // ===== STAGE 6: Blockchain & UI =====
    '6-emit': {
      active: ['node-31'],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
        'node-29', 'node-30',
      ],
    },
    '6-ui-event': {
      active: ['node-32'],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
        'node-29', 'node-30', 'node-31',
      ],
    },
    '6-fetch-report': {
      active: ['node-33'],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
        'node-29', 'node-30', 'node-31', 'node-32',
      ],
    },

    // ===== COMPLETED =====
    'completed': {
      active: [],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
        'node-29', 'node-30', 'node-31', 'node-32', 'node-33',
      ],
    },
  };

  // Try to find exact match with substep
  const key = substep ? `${stage}-${substep}` : `${stage}`;
  if (mapping[key]) {
    return mapping[key];
  }

  // Fallback: return based on stage only
  const fallbackMapping: Record<number, ProgressMapping> = {
    1: { active: ['node-1', 'node-2', 'node-3'], completed: [] },
    2: { active: ['node-4'], completed: ['node-1', 'node-2', 'node-3'] },
    3: { active: ['node-5', 'node-13', 'node-21'], completed: ['node-1', 'node-2', 'node-3', 'node-4'] },
    4: {
      active: ['node-9', 'node-10', 'node-17', 'node-18', 'node-25', 'node-26'], // AI & Reverse Search
      completed: ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8'],
    },
    5: {
      active: ['node-29', 'node-30'],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
      ],
    },
    6: {
      active: ['node-31', 'node-32', 'node-33'],
      completed: [
        'node-1', 'node-2', 'node-3', 'node-4',
        'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12',
        'node-13', 'node-14', 'node-15', 'node-16', 'node-17', 'node-18', 'node-19', 'node-20',
        'node-21', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'node-27', 'node-28',
        'node-29', 'node-30',
      ],
    },
  };

  return fallbackMapping[stage] || { active: [], completed: [] };
}

