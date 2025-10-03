# **App Name**: Optimal Cook

## Core Features:

- User Authentication: Implement user registration and login using Firebase Authentication, including Google sign-in.
- Project Management: Allow users to create, view, and manage cooking projects, each containing multiple recipes.
- Recipe and Task Input: Enable users to add and edit recipes and their tasks, specifying names, durations, and dependencies, with editable tasks in the interface.
- File Import: Implement functionality to import recipes from files (TXT, Excel, PDF, Images) via Firebase Storage, processing them into recipes and tasks.
- Critical Path Method (CPM) Algorithm: Calculate the optimal sequence of cooking tasks using the CPM algorithm to minimize total preparation time.
- Task dependency suggestion tool: Suggest potential task dependencies based on common cooking practices using a generative AI tool. Users can confirm or edit the suggestion.
- Step-by-Step Guide: Display a chronologically ordered list of tasks with parallel execution indications and an optional Gantt chart for timeline visualization, highlighting critical path tasks.

## Style Guidelines:

- Primary color: A vibrant, culinary-inspired red (#E63946) to stimulate appetite and convey energy.
- Background color: Light gray (#F4F3F4) to provide a clean, neutral backdrop that enhances focus on the content.
- Accent color: Analogous orange (#F18E33) for interactive elements and important actions.
- Font pairing: 'Poppins' (sans-serif) for headlines and short amounts of text, 'PT Sans' (sans-serif) for body text.
- Use clear, intuitive icons for recipe actions and status indicators, ensuring they are easily recognizable.
- Implement a responsive design with a clear, step-by-step layout for tasks, optimized for both desktop and mobile devices.
- Incorporate subtle transitions and animations to guide users through the cooking process and provide feedback on task completion.