package domain

import "testing"

func TestTransition(t *testing.T) {
	cases := []struct {
		name string
		current AlertState
		next AlertState
		reason string
		allowed bool
	}{
		{"acknowledge raised", Raised, Acknowledged, "", true},
		{"escalate raised", Raised, Escalated, "", true},
		{"resolve requires reason", Acknowledged, Resolved, "", false},
		{"resolve with reason", Escalated, Resolved, "review complete", true},
		{"resolved is terminal", Resolved, Raised, "", false},
	}
	for _, item := range cases {
		t.Run(item.name, func(t *testing.T) {
			if got := Transition(item.current, item.next, item.reason); got != item.allowed {
				t.Fatalf("got %v, want %v", got, item.allowed)
			}
		})
	}
}
