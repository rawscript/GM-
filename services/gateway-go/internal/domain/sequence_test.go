package domain

import "testing"

func TestCompareSequence(t *testing.T) {
	cases := []struct {
		name string
		previous uint64
		current uint64
		gap uint64
		duplicate bool
	}{
		{"contiguous", 4, 5, 0, false},
		{"gap", 4, 8, 3, false},
		{"duplicate", 4, 4, 0, true},
		{"late", 8, 4, 0, true},
	}
	for _, item := range cases {
		t.Run(item.name, func(t *testing.T) {
			result := CompareSequence(item.previous, item.current)
			if result.Gap != item.gap || result.Duplicate != item.duplicate {
				t.Fatalf("unexpected result: %#v", result)
			}
		})
	}
}
