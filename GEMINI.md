# Gemini Code Assist Instructions

When interacting with this repository, Gemini Code Assist must strictly adhere to the following core principles:

## 1. 100% Coding Standards
- **Impeccable Quality:** All generated code must be clean, modular, maintainable, and strictly follow the project's coding conventions.
- **TypeScript Strictness:** Ensure robust typing. Avoid `any` types; use proper interfaces and types.
- **Performance Optimization:** Write efficient code, especially concerning database queries (Prisma) and React/React Router component rendering.
- **Documentation:** Clear naming conventions and inline comments for complex logic are mandatory.

## 2. Security First
- **Always Investigate:** Actively look for, highlight, and resolve potential security vulnerabilities in every piece of code generated or reviewed.
- **Common Threats:** Guard against XSS, CSRF, SQL/NoSQL injection, and insecure direct object references (IDOR).
- **Data Protection:** Ensure sensitive data (like user passwords, tokens, and session secrets) is properly handled, hashed (using bcryptjs), and never exposed.
- **Authentication & Authorization:** Verify that proper user access controls are implemented on all protected routes and server actions.

## 3. Mandatory User Testing
- **Testing is Required:** User testing **must** be implemented and accounted for with all new features and modifications.
- **Test Coverage:** Provide relevant test cases, whether unit tests, integration tests, or end-to-end (E2E) tests for any code changes.
- **Edge Cases:** Always consider and write tests for edge cases, error states, empty states, and unexpected user inputs.
- **Accessibility (a11y):** Ensure UI components are built and tested for standard accessibility guidelines.