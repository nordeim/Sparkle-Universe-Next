# Plan to Fix TypeScript Type-Check Errors (Revised)

This document outlines the necessary steps to resolve the `npm run type-check` errors related to nullable types and missing `override` modifiers. Each section includes a list of affected files and a checklist to track progress. This plan has been revised after a comprehensive scan of the project structure.

---

## 1. Fix Nullable Type Issues (`string | null`)

**Strategy:** The primary goal is to ensure type safety where values can be `null`. We will use the nullish coalescing operator (`??`) for safe defaults, update type definitions where `null` is a valid propagated value, or implement type guards for conditional logic.

### Files to Fix:

-   [ ] **`src/lib/auth/auth.ts`**
    -   **Issue:** User session properties like `id`, `name`, `email`, and `image` are potentially `null` but may be assigned to strictly typed variables.
    -   **Plan:**
        -   [ ] In the `session` callback, use nullish coalescing (`?? ''` or `?? null`) to ensure the `session.user` object has defined values.
        -   [ ] In the `jwt` callback, ensure values passed to the token are handled correctly if they are `null`.

-   [ ] **`src/hooks/use-auth.ts`**
    -   **Issue:** The hook consumes the session object, and downstream components may not expect `null` values for user properties.
    -   **Plan:**
        -   [ ] Ensure the hook's return type accurately reflects the possibility of `null` values (e.g., `string | null`).
        -   [ ] Provide sensible defaults (e.g., `name: session.user.name ?? 'Guest'`) if appropriate for the UI.

-   [ ] **`src/server/services/admin.service.ts`**
    -   **Issue:** Functions fetching data from the database might return records with `null` fields.
    -   **Plan:**
        -   [ ] Review functions that query the database. When processing results, use `??` to provide default values before returning data to the API layer.
        -   [ ] Update the return types of functions to accurately reflect `| null` where applicable.

-   [ ] **`src/services/user.service.ts`**
    -   **Issue:** This service directly interacts with user data from the database, which is a common source of `null` values for optional fields like `image` or `name`.
    -   **Plan:**
        -   [ ] In functions that fetch or update user data, handle potential `null` values from the database response.
        -   [ ] Ensure return types correctly specify `| null` for fields that can be null.

-   [ ] **`src/components/admin/admin-header.tsx`**
    -   **Issue:** This component likely displays user information (e.g., name, avatar) from the `useSession` or `use-auth` hook, which can contain `null` values.
    -   **Plan:**
        -   [ ] Before rendering `user.name` or `user.image`, add a null check or use nullish coalescing.
        -   **Example:** `<span>{session.user?.name ?? 'Admin'}</span>`
        -   **Example:** `<Avatar src={session.user?.image ?? '/default-avatar.png'} />`

-   [ ] **`src/components/admin/admin-sidebar.tsx`**
    -   **Issue:** Similar to the header, the sidebar may display user information that could be `null`.
    -   **Plan:**
        -   [ ] Check for `null` on user properties before rendering them. Use `??` for safe fallbacks.

---

## 2. Fix Missing `override` Modifiers

**Strategy:** TypeScript requires the `override` keyword for methods that override a method from a base class. This improves code clarity and prevents accidental overriding. We will add the `override` modifier to all such methods.

### Files to Fix:

-   [ ] **`src/components/error-boundary.tsx`**
    -   **Issue:** The class component `ErrorBoundary` extends `React.Component` and overrides its lifecycle methods without the `override` keyword.
    -   **Plan:**
        -   [ ] Add `override` to the `componentDidCatch` method.
        -   [ ] Add `override` to the `render` method.

-   [ ] **`src/lib/events/event-emitter.ts`**
    -   **Issue:** Any class that extends `EventEmitter` and re-implements methods like `on`, `emit`, or `off` will require the `override` keyword.
    -   **Plan:**
        -   [ ] Identify all classes that `extend EventEmitter` within the codebase.
        -   [ ] Add the `override` keyword to any methods that are redefined in the subclass.

-   [ ] **`src/lib/jobs/job-processor.ts`**
    -   **Issue:** If this file defines classes that extend a base processor or worker class, they may be overriding methods like `process` or `handle`.
    -   **Plan:**
        -   [ ] Review any classes within this file for `extends` clauses.
        -   [ ] Add `override` to any methods that are inherited from a base class.

---

This revised plan is more thorough and provides a clear roadmap for resolving the type-check errors across the project.