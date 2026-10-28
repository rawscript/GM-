package domain

type SequenceResult struct {
	Gap      uint64
	Duplicate bool
}

func CompareSequence(previous, current uint64) SequenceResult {
	if current <= previous {
		return SequenceResult{Duplicate: true}
	}
	return SequenceResult{Gap: current - previous - 1}
}
