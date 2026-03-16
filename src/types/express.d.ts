// Extends Express's built-in Request interface so req.userId is available
// on the base type without needing the custom AuthenticatedRequest.
// The auth middleware sets this before any controller runs.
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export {}
