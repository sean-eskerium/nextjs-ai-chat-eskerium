# Unit Testing Best Practices

## Test Element Selection
- Use `data-testid` attributes for reliable element selection, especially for:
  - Hidden or visually obscured elements
  - Elements with ambiguous roles or text content
  - Elements that might have duplicate roles/text
- Follow a consistent naming convention for test IDs

## Mock Response Handling
- Always properly type mock responses (e.g., `as jest.Mock` for TypeScript)
- Clean up mocks between tests using `beforeEach`
- Mock all necessary dependencies (fetch, file operations, window properties)
- Provide complete mock responses that match the actual API structure

## Assertions and Expectations
- Prefer exact matches over partial matches when possible
- Use `toHaveBeenCalledWith` with exact parameters instead of `expect.arrayContaining` when the exact structure is known
- Be explicit about expected data structures in tests

## Async Testing
- Use `waitFor` with its default timeout unless there's a specific reason not to
- Properly await all async operations
- Consider all side effects that might need to be waited for (state updates, UI changes)
- Handle both success and error cases for async operations

## Test Organization
- Group related tests using descriptive `describe` blocks
- Keep test cases focused and isolated
- Use clear, descriptive test names that indicate:
  - The scenario being tested
  - The expected outcome
  - Any special conditions

## Common Pitfalls to Avoid
- Don't rely on implementation details for tests
- Avoid unnecessary timeouts in `waitFor`
- Don't use partial matchers when exact matches are possible
- Avoid testing multiple behaviors in a single test case 