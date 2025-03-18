Before diving into the best practices, please note that you may need to adapt the globs depending on your project's specific structure and file types.

---
name: react-best-practices.mdc
description: Best practices for React 19 applications
globs: **/*.{js,jsx}
---

- Utilize React 19's new features like automatic batching for better performance.
- Keep components small and focused on a single responsibility for easier maintenance.
- Use `useState` and `useReducer` for state management to ensure simpler and more predictable state updates.
- Implement proper error boundaries to enhance user experience and application stability.
- Use functional components with hooks for cleaner and more concise code.

---
name: react-router-dom-best-practices.mdc
description: Best practices for routing with react-router-dom
globs: **/*.{js,jsx}
---

- Use the latest version of react-router-dom for improved performance and features.
- Implement nested routes to create a more organized and maintainable routing structure.
- Use the `useNavigate` hook for programmatic navigation to enhance user experience.
- Implement route protection to ensure secure access to certain routes.
- Use `useParams` and `useLocation` hooks for easier data handling within routes.

---
name: shadcn-ui-best-practices.mdc
description: Best practices for using Shadcn UI components
globs: **/*.{js,jsx,css}
---

- Follow Shadcn UI's component guidelines to ensure consistent styling across your application.
- Customize components using the provided utility classes for more flexible and maintainable UI.
- Ensure all components are accessible by following Shadcn UI's accessibility best practices.
- Use Shadcn UI's responsive design features to enhance user experience on different devices.
- Keep components up-to-date with the latest Shadcn UI releases for improved performance and features.

---
name: axios-best-practices.mdc
description: Best practices for making HTTP requests with Axios
globs: **/*.{js,jsx}
---

- Use Axios interceptors to handle global request and response logic for more secure and consistent API interactions.
- Implement proper error handling and retries to enhance user experience and application reliability.
- Use Axios' cancel token feature to manage and cancel ongoing requests for better performance.
- Configure Axios defaults to reduce code duplication and improve maintainability.
- Use Axios' built-in support for JSON data to simplify data handling and ensure data integrity.

---
name: formik-best-practices.mdc
description: Best practices for form handling with Formik
globs: **/*.{js,jsx}
---

- Use Formik's validation schema to ensure data integrity and enhance user experience.
- Implement custom validation functions for more complex form logic and better security.
- Use Formik's `useFormik` hook for more concise and maintainable form code.
- Implement proper error handling and display to improve user experience and form usability.
- Use Formik's built-in support for asynchronous form submission to enhance performance and user feedback.