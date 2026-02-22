# Forge's Architecture Journal

2024-05-22 - [Architecture Initialization]
Decision: Established `.jules/forge.md` for architectural tracking.
Reasoning: To maintain a clear history of architectural decisions and constraints.
Constraint: All architectural changes must be recorded here.

2024-05-22 - [Form Fuzzing Integration]
Decision: Integrate Form Fuzzing into `GORILLA` mode within `PrimalEngine`.
Reasoning: Form fuzzing is a form of chaos testing, fitting the `GORILLA` mode's purpose. It enhances the random interaction capabilities.
Constraint: Ensure form inputs are filled with valid-ish data to avoid immediate validation errors, but still random enough to stress test.
