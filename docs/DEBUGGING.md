# Debugging Guide

## API Key Verification Issues

If you're experiencing issues with API key verification, here are some common problems and solutions:

### 401 Unauthorized: Missing or invalid token

This error occurs when the API key is not properly passed to the API endpoint. Here are some possible solutions:

1. **Check if you're logged in**: Make sure you're logged in to the application. You can use the login page to log in with your username and password.

2. **Check if your API key is stored**: After logging in, make sure your API key is stored in the application. You can do this by going to the API key settings page.

3. **Check if your API key is valid**: Make sure your API key is valid. In development mode, you can use a test API key that starts with `sk-ant-test`. In production, you need to use a real Anthropic API key.

4. **Check if your token is valid**: Make sure your authentication token is valid. If you're getting a 401 error, it might be because your token has expired. Try logging out and logging back in.

### Development Mode

In development mode, the application accepts test API keys without verifying them with Anthropic. This makes it easier to develop and test the application without needing a real Anthropic API key.

To use development mode, make sure your API key starts with `sk-ant-test`. For example:

```
sk-ant-test123456789
```

### Production Mode

In production mode, the application verifies API keys with Anthropic. This ensures that only valid API keys are used.

To use production mode, make sure your API key is a valid Anthropic API key. It should start with `sk-ant-` but not `sk-ant-test`.

## Troubleshooting

If you're still experiencing issues, try the following:

1. **Check the server logs**: Look at the server logs to see if there are any error messages that might help diagnose the issue.

2. **Run the tests**: Run the tests to see if they pass. If they fail, it might give you more information about the issue.

3. **Use the test scripts**: Use the test scripts in the root directory to test specific functionality. For example, `test-api-key.js` tests API key verification.

4. **Check the browser console**: Open the browser console to see if there are any error messages that might help diagnose the issue.

## Error Handling

The application now provides more detailed error messages to help diagnose issues. When an API error occurs, the error message will include:

- The HTTP status code and status text
- The specific error message from the server
- Additional details if available

This makes it easier to identify and fix issues, especially when working with external APIs like Anthropic.

### Validation Errors

The application now has a comprehensive validation system with both client-side and server-side validation:

#### Client-Side Validation
- Real-time validation as users type (after first field interaction)
- Immediate feedback with field-specific error messages
- Visual indicators (red borders) for invalid fields
- Validation rules are applied consistently across the application

#### Server-Side Validation
- Zod validation on the backend ensures data integrity
- Validation errors are properly formatted and returned to the frontend
- The frontend parses and displays these errors in the appropriate form fields

#### Centralized Error Handling
- A dedicated error context manages all form errors
- Form fields automatically connect to this context
- API errors are automatically mapped to form fields
- Consistent error styling and messaging throughout the app

This dual approach ensures both a responsive user experience and robust data validation.

## Recent Changes

### 2025-03-12: Implemented Comprehensive Validation System

- Created a centralized error context for managing form errors
- Built a reusable FormField component with real-time validation
- Implemented a validation rules system with common validation patterns
- Connected API error responses to the form validation system
- Added client-side validation that matches server-side validation rules

### 2025-03-12: Improved Validation Error Handling

- Added support for displaying Zod validation errors in the frontend
- Updated the backend to properly format and return validation errors
- Modified form components to display field-specific validation errors
- Improved the user experience by highlighting invalid fields

### 2025-03-12: Improved Error Handling

- Added a custom ApiError class that provides more detailed error information
- Updated all components to display detailed error messages
- Improved error logging in the console with request and response details

### 2025-03-12: Updated Claude Service to use Anthropic SDK

- Changed the implementation to use the Anthropic SDK directly instead of making fetch requests
- Fixed issues with API key verification
- Added better error handling for API key verification
- Added support for test API keys in development mode
