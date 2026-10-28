package domain

type AlertState uint8

const (
	Raised AlertState = iota + 1
	Acknowledged
	Escalated
	Resolved
)

func Transition(current, next AlertState, reason string) bool {
	if current == Raised && (next == Acknowledged || next == Escalated) {
		return true
	}
	if current == Acknowledged && (next == Escalated || next == Resolved) {
		return next != Resolved || len(reason) >= 3
	}
	if current == Escalated && next == Resolved {
		return len(reason) >= 3
	}
	return false
}
