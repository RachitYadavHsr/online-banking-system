// Simulated Core Banking System posting (SRS: CBS integration is simulated
// in Version 1.0 - see Exp-1 2.5, Exp-8 Core Banking Connector component).
// Shared by every module that posts a debit/credit, so the failure rate is
// configured in exactly one place.
const CBS_SIMULATED_FAILURE_RATE = parseFloat(process.env.CBS_SIMULATED_FAILURE_RATE || '0.05');

function simulateCbsPosting() {
  return Math.random() >= CBS_SIMULATED_FAILURE_RATE;
}

module.exports = { simulateCbsPosting };
