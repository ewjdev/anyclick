# @ewjdev/anyclick-t3chat

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

## 3.0.0

### Major Changes

- Add new adapter packages for T3.chat and UploadThing integrations

  - **@ewjdev/anyclick-t3chat**: New adapter package for sending text and queries to t3.chat with autofill support and prompt refinement
  - **@ewjdev/anyclick-uploadthing**: New adapter package for uploading screenshots and images to UploadThing with cross-origin request handling
