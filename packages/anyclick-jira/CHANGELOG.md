# @ewjdev/anyclick-jira

## 5.1.0

### Minor Changes

- 353c4ca: Rebrand from Feedback to Anyclick

  - Rename FeedbackProvider to AnyclickProvider
  - Rename FeedbackMenu to AnyclickMenu
  - Rename useFeedback hook to useAnyclick
  - Update all component names, comments, and documentation to use Anyclick branding
  - Update package homepages to use anyclick.dev domain

### Patch Changes

- Updated dependencies [353c4ca]
  - @ewjdev/anyclick-core@5.1.0

## 1.0.0

### Initial Release

- 🎯 Create Jira issues from UI feedback
- 📸 Automatic screenshot attachment upload
- 🎨 Rich Atlassian Document Format (ADF) descriptions
- 🏷️ Automatic label management based on feedback type
- 🔧 Customizable issue type mapping
- ✅ Configuration validation
- 🔒 Jira Cloud support with API token authentication

### Features

- **JiraAdapter**: Core adapter class for creating Jira issues
- **Default Formatters**: Built-in summary and description formatters optimized for Jira
- **Screenshot Support**: Automatic upload of element, container, and viewport screenshots as attachments
- **Custom Fields**: Support for custom fields like Epic Link and Team
- **Multi-Adapter Support**: Works alongside GitHub adapter for dual submission
- **Error Handling**: Comprehensive error messages with diagnostic information
- **Configuration Validation**: Validate credentials and project access before creating issues

### Supported Jira Features

- Jira Cloud REST API v3
- Basic authentication with email + API token
- Atlassian Document Format (ADF) for rich descriptions
- Issue type mapping (Bug, Story, Task, etc.)
- Label management
- Screenshot attachments
- Custom fields

### Requirements

- Node.js >= 18.18.0
- Jira Cloud instance
- Valid Jira API token with issue creation permissions
